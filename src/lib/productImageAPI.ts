/**
 * Client pour l'API de fidélité d'images produits
 * Intègre les fonctionnalités d'upload, analyse, génération et validation
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_PRODUCT_API_URL || 'http://localhost:3000';

export interface ProductIdentity {
  name: string;
  brand: string;
  category: string;
  colors: string[];
  shapes: string[];
  logos: string[];
  uniqueFeatures: string[];
}

export interface AnalysisResult {
  productIdentity: ProductIdentity;
  confidence: number;
  extractedText: string;
}

export interface GenerationResult {
  imageUrl: string;
  scene: string;
  prompt: string;
}

export interface ValidationResult {
  fidelityScore: number;
  issues: string[];
  recommendations: string[];
}

export interface CompositeResult {
  imageUrl: string;
  technique: string;
  effects: string[];
}

export interface UploadResult {
  imageId: string;
  imageUrl: string;
  path: string;
}

export class ProductImageAPI {
  private async makeRequest(endpoint: string, data: FormData | object, method = 'POST') {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      method,
      headers: data instanceof FormData ? {} : {
        'Content-Type': 'application/json',
      },
      body: data instanceof FormData ? data : JSON.stringify(data),
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Upload une image produit
   */
  async uploadProduct(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await this.makeRequest('/upload-product', formData);
    const imagePath = response.product.path;
    const normalizedPath = imagePath.replace(/\\/g, '/');
    const imageUrl = response.product.imageUrl || response.product.url || `${API_BASE_URL}/${normalizedPath}`;

    return {
      imageId: response.product.id,
      imageUrl,
      path: imagePath
    };
  }

  /**
   * Analyse l'identité du produit
   */
  async analyzeProduct(productImagePath: string): Promise<AnalysisResult> {
    return this.makeRequest('/analyze-product', { productImagePath });
  }

  /**
   * Génère une scène lifestyle avec le produit
   */
  async generateScene(
    productIdentity: object,
    scenePrompt: string,
    productImagePath?: string
  ): Promise<GenerationResult> {
    return this.makeRequest('/generate-scene', {
      productIdentity,
      scenePrompt,
      productImagePath
    });
  }

  /**
   * Valide la fidélité du produit généré
   */
  async validateProduct(
    originalImagePath: string,
    productIdentity: object,
    generatedImagePath: string
  ): Promise<ValidationResult> {
    return this.makeRequest('/validate-product', {
      originalImagePath,
      productIdentity,
      generatedImagePath
    });
  }

  /**
   * Composite le produit dans une scène
   */
  async compositeProduct(
    originalProductPath: string,
    generatedScenePath: string,
    options?: object
  ): Promise<CompositeResult> {
    return this.makeRequest('/composite-product', {
      originalProductPath,
      generatedScenePath,
      options
    });
  }

  /**
   * Workflow complet : upload → analyse → génération → validation → compositing
   */
  async completeWorkflow(
    file: File,
    scene: string,
    style?: string
  ): Promise<{
    originalImage: { id: string; url: string; path: string };
    analysis: AnalysisResult;
    generation: GenerationResult;
    validation: ValidationResult;
    composite: CompositeResult;
  }> {
    // Upload
    const uploadResult = await this.uploadProduct(file);

    // Workflow complet via l'endpoint unifié du backend.
    const response = await this.makeRequest('/generate-with-validation', {
      productImage: uploadResult.path,
      scenePrompt: scene,
      compositeOptions: { enabled: true, style }
    });

    const finalImagePath = response.workflow.finalImage;
    const normalizedFinalPath = finalImagePath?.replace(/\\/g, '/');
    const finalImageUrl = normalizedFinalPath?.startsWith('http')
      ? normalizedFinalPath
      : `${API_BASE_URL}/${normalizedFinalPath}`;

    return {
      originalImage: {
        id: uploadResult.imageId,
        url: uploadResult.imageUrl,
        path: uploadResult.path
      },
      analysis: response.workflow.steps.analysis,
      generation: {
        imageUrl: finalImageUrl,
        scene,
        prompt: scene
      },
      validation: {
        fidelityScore: response.workflow.steps.validation.fidelityScore,
        issues: response.workflow.steps.validation.issues || [],
        recommendations: response.workflow.steps.validation.recommendations || []
      },
      composite: {
        imageUrl: finalImageUrl,
        technique: response.workflow.steps.composite?.fileName || 'composite',
        effects: []
      }
    };
  }

  /**
   * Vérifie la santé de l'API
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  }
}

// Instance singleton
export const productImageAPI = new ProductImageAPI();
