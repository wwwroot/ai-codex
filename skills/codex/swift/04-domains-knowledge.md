# 04 — Domain Knowledge & Ecosystems (Swift Edition)

> Reference this file when building features in specific Apple platform domains or server-side Swift.

---

## 1. SwiftUI 6+ & Modern UI Engineering

SwiftUI is the primary declarative UI framework for all Apple platforms.

### State & Observation Architecture
```swift
import SwiftUI
import Observation

@Observable
@MainActor
public final class ProductListViewModel {
    public var products: [Product] = []
    public var searchQuery: String = ""
    public var state: ViewState<[Product]> = .idle
    
    private let client: ProductClientProtocol

    public init(client: ProductClientProtocol) {
        self.client = client
    }

    public func loadProducts() async {
        state = .loading
        do {
            products = try await client.fetchProducts()
            state = products.isEmpty ? .empty : .loaded(data: products)
        } catch let error as NetworkError {
            state = .failed(error: error)
        } catch {
            state = .failed(error: .serverError(statusCode: 500, message: error.localizedDescription))
        }
    }
}

public struct ProductListView: View {
    @State private var viewModel: ProductListViewModel

    public init(viewModel: ProductListViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    public var body: some View {
        NavigationStack {
            Group {
                switch viewModel.state {
                case .idle, .loading:
                    ProgressView("Loading inventory...")
                case .empty:
                    ContentUnavailableView("No Products", systemImage: "tray", description: Text("Try checking back later."))
                case .loaded(let items):
                    List(items) { item in
                        NavigationLink(value: item) {
                            ProductRow(product: item)
                        }
                    }
                case .failed(let error):
                    ContentUnavailableView("Error", systemImage: "exclamationmark.triangle", description: Text(error.localizedDescription))
                }
            }
            .navigationTitle("Products")
            .navigationDestination(for: Product.self) { product in
                ProductDetailView(product: product)
            }
            .task {
                await viewModel.loadProducts()
            }
        }
    }
}
```

### Custom Layout Protocol
Use `Layout` protocol when standard `HStack`/`VStack` cannot express complex geometric alignment:

```swift
public struct FlowLayout: Layout {
    public var spacing: CGFloat = 8

    public func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        var height: CGFloat = 0
        var x: CGFloat = 0
        var rowHeight: CGFloat = 0

        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > width {
                x = 0
                height += rowHeight + spacing
                rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: width, height: height + rowHeight)
    }

    public func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0

        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
```

---

## 2. SwiftData & Persistence Architecture

SwiftData provides macro-driven, type-safe data modeling backed by Core Data storage.

### Data Model Definition
```swift
import SwiftData
import Foundation

@Model
public final class Note {
    @Attribute(.unique) public var id: UUID
    public var title: String
    public var content: String
    public var createdAt: Date
    public var isArchived: Bool
    
    @Relationship(deleteRule: .cascade, inverse: \Tag.notes)
    public var tags: [Tag] = []

    public init(id: UUID = UUID(), title: String, content: String, createdAt: Date = .now, isArchived: Bool = false) {
        self.id = id
        self.title = title
        self.content = content
        self.createdAt = createdAt
        self.isArchived = isArchived
    }
}

@Model
public final class Tag {
    @Attribute(.unique) public var name: String
    public var notes: [Note] = []

    public init(name: String) {
        self.name = name
    }
}
```

### Background Persistence via `ModelActor`
Never perform heavy batch writes on the main context:

```swift
@ModelActor
public actor BackgroundDataImporter {
    public func importJSONBatch(data: [NoteDTO]) throws {
        for dto in data {
            let note = Note(id: dto.id, title: dto.title, content: dto.content)
            modelContext.insert(note)
        }
        try modelContext.save()
    }
}
```

---

## 3. Apple Silicon, Metal & Machine Learning

Leverage the unified memory architecture of Apple Silicon (M-series / A-series) and Apple Neural Engine (ANE).

### CoreML Execution & Model Optimization
```swift
import CoreML
import Vision

public actor ImageClassifierService {
    private var model: VNCoreMLModel?

    public init() {
        if let compiled = try? MLModel(contentsOf: ModelURL),
           let vnModel = try? VNCoreMLModel(for: compiled) {
            self.model = vnModel
        }
    }

    public func classify(pixelBuffer: CVPixelBuffer) async throws -> [VNClassificationObservation] {
        guard let model else { throw ClassifierError.modelNotLoaded }
        
        return try await withCheckedThrowingContinuation { continuation in
            let request = VNCoreMLRequest(model: model) { request, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                let results = request.results as? [VNClassificationObservation] ?? []
                continuation.resume(returning: results)
            }
            
            let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])
            do {
                try handler.perform([request])
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }
}
```

---

## 4. Server-Side Swift (Hummingbird 2 / Vapor 4)

Swift provides memory-safe, low-latency microservices and backend APIs.

### Modern Hummingbird 2 Service
```swift
import Hummingbird
import Logging

public struct AppRequestContext: RequestContext {
    public var coreContext: CoreRequestContextStorage
    public init(source: Source) {
        self.coreContext = .init(source: source)
    }
}

public func buildApplication() async throws -> some ApplicationProtocol {
    let router = Router(context: AppRequestContext.self)
    
    router.get("/health") { _, _ -> HTTPResponse.Status in
        return .ok
    }

    router.post("/api/v1/echo") { request, context -> String in
        let buffer = try await request.body.collect(upTo: 1024 * 1024)
        return String(buffer: buffer)
    }

    return Application(
        router: router,
        configuration: .init(address: .hostname("0.0.0.0", port: 8080))
    )
}
```

---

## 5. Multiplatform Apple Ecosystem

Target iOS, iPadOS, macOS, visionOS, and watchOS from a unified codebase:

```swift
public struct AdaptiveActionToolbar: View {
    public var onShare: () -> Void
    public var onExport: () -> Void

    public var body: some View {
        #if os(iOS)
        HStack {
            Button(action: onShare) { Label("Share", systemImage: "square.and.arrow.up") }
            Button(action: onExport) { Label("Export", systemImage: "doc.badge.plus") }
        }
        .controlSize(.regular)
        #elseif os(macOS)
        HStack {
            Button("Share", action: onShare)
            Button("Export", action: onExport)
        }
        .controlSize(.small)
        #elseif os(visionOS)
        HStack(spacing: 16) {
            Button(action: onShare) { Image(systemName: "square.and.arrow.up") }
            Button(action: onExport) { Image(systemName: "doc.badge.plus") }
        }
        .buttonStyle(.borderedProminent)
        .hoverEffect()
        #endif
    }
}
```
