'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useRef } from 'react';
import { productImageAPI, type ProductIdentity, type GenerationResult, type ValidationResult, type CompositeResult } from '@/lib/productImageAPI';

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: unknown;
  error?: string;
}

export default function ProductImageTester() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedScene, setSelectedScene] = useState<string>('modern-living-room');
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { name: 'Upload', status: 'pending' },
    { name: 'Analysis', status: 'pending' },
    { name: 'Generation', status: 'pending' },
    { name: 'Validation', status: 'pending' },
    { name: 'Compositing', status: 'pending' },
  ]);
  const [results, setResults] = useState<{
    originalImage?: { id: string; url: string };
    analysis?: { productIdentity: ProductIdentity };
    generation?: GenerationResult;
    validation?: ValidationResult;
    composite?: CompositeResult;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scenes = [
    { value: 'modern-living-room', label: 'Salon moderne' },
    { value: 'kitchen-counter', label: 'Comptoir de cuisine' },
    { value: 'bedroom-nightstand', label: 'Table de chevet' },
    { value: 'office-desk', label: 'Bureau de travail' },
    { value: 'outdoor-patio', label: 'Terrasse extérieure' },
    { value: 'dining-table', label: 'Table à manger' },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Reset results when new file is selected
      setResults({});
      setSteps(prev => prev.map(step => ({ ...step, status: 'pending', result: undefined, error: undefined })));
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);

    try {
      const workflowResult = await productImageAPI.completeWorkflow(selectedFile, selectedScene);

      // Update all steps as completed
      setSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));

      setResults(workflowResult);
    } catch (error) {
      console.error('Workflow failed:', error);
      // Mark failed step as error
      setSteps(prev => prev.map(step => ({
        ...step,
        status: step.status === 'processing' ? 'error' : step.status,
        error: step.status === 'processing' ? (error as Error).message : step.error
      })));
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'error': return '❌';
      default: return '⏸️';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Testeur API Fidélité Images Produits
        </h1>
        <p className="text-gray-600">
          Uploadez une image produit et générez des scènes lifestyle réalistes
        </p>
      </div>

      {/* File Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">1. Sélectionner l&apos;image produit</h2>

        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Choisir une image
          </button>

          {selectedFile && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{selectedFile.name}</span>
              <span className="text-xs text-gray-400">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="mt-4">
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Aperçu"
              className="max-w-xs max-h-48 object-contain border border-gray-200 rounded"
            />
          </div>
        )}
      </div>

      {/* Scene Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">2. Choisir la scène</h2>

        <select
          value={selectedScene}
          onChange={(e) => setSelectedScene(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {scenes.map(scene => (
            <option key={scene.value} value={scene.value}>
              {scene.label}
            </option>
          ))}
        </select>
      </div>

      {/* Process Button */}
      <div className="text-center">
        <button
          onClick={handleProcess}
          disabled={!selectedFile || isProcessing}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
        >
          {isProcessing ? 'Traitement en cours...' : 'Lancer le traitement complet'}
        </button>
      </div>

      {/* Processing Steps */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Progression du traitement</h2>

        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.name} className="flex items-center space-x-3">
              <span className="text-lg">{getStepIcon(step.status)}</span>
              <span className={`font-medium ${step.status === 'error' ? 'text-red-600' : 'text-gray-900'}`}>
                {step.name}
              </span>
              {step.error && (
                <span className="text-sm text-red-500">{step.error}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {Object.keys(results).length > 0 && (
        <div className="space-y-6">
          {/* Original Image */}
          {results.originalImage && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Image originale</h3>
              <img
                src={results.originalImage.url}
                alt="Image originale"
                className="max-w-xs object-contain border border-gray-200 rounded"
              />
            </div>
          )}

          {/* Product Analysis */}
          {results.analysis && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Analyse du produit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Informations extraites</h4>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li><strong>Nom:</strong> {results.analysis.productIdentity.name}</li>
                    <li><strong>Marque:</strong> {results.analysis.productIdentity.brand}</li>
                    <li><strong>Catégorie:</strong> {results.analysis.productIdentity.category}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Caractéristiques</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <div>
                      <strong>Couleurs:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {results.analysis.productIdentity.colors.map(color => (
                          <span key={color} className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <strong>Formes:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {results.analysis.productIdentity.shapes.map(shape => (
                          <span key={shape} className="px-2 py-1 bg-blue-100 rounded text-xs">
                            {shape}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generated Scene */}
          {results.generation && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Scène générée</h3>
              <div className="space-y-4">
                <img
                  src={results.generation.imageUrl}
                  alt="Scène générée"
                  className="max-w-full h-auto border border-gray-200 rounded"
                />
                <div className="text-sm text-gray-600">
                  <p><strong>Scène:</strong> {results.generation.scene}</p>
                  <p><strong>Prompt:</strong> {results.generation.prompt}</p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Results */}
          {results.validation && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Validation de fidélité</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {results.validation.fidelityScore >= 80 ? '🎉' :
                     results.validation.fidelityScore >= 60 ? '👍' : '⚠️'}
                  </span>
                  <span className="text-xl font-bold">
                    Score: {results.validation.fidelityScore}/100
                  </span>
                </div>

                {results.validation.issues.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600">Problèmes détectés:</h4>
                    <ul className="mt-1 list-disc list-inside text-sm text-red-600">
                      {results.validation.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.validation.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-600">Recommandations:</h4>
                    <ul className="mt-1 list-disc list-inside text-sm text-blue-600">
                      {results.validation.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Final Composite */}
          {results.composite && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Résultat final (Compositing)</h3>
              <div className="space-y-4">
                <img
                  src={results.composite.imageUrl}
                  alt="Image composite finale"
                  className="max-w-full h-auto border border-gray-200 rounded"
                />
                <div className="text-sm text-gray-600">
                  <p><strong>Technique:</strong> {results.composite.technique}</p>
                  <p><strong>Effets:</strong> {results.composite.effects.join(', ')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
