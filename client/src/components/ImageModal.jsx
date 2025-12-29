import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

function ImageModal({ onClose }) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [revisedPrompt, setRevisedPrompt] = useState('');
  const [error, setError] = useState('');

  const sizes = ['1024x1024', '1792x1024', '1024x1792'];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError('');
    setGeneratedImage(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setGeneratedImage(data.url);
        setRevisedPrompt(data.revisedPrompt);
      }
    } catch (err) {
      setError('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="image-modal" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="image-modal-header">
          <h2 className="image-modal-title">Generate Image</h2>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <input
          type="text"
          className="image-prompt-input"
          placeholder="Describe the image you want to create..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />

        <div className="image-size-selector">
          {sizes.map((s) => (
            <button
              key={s}
              className={`size-btn ${size === s ? 'active' : ''}`}
              onClick={() => setSize(s)}
            >
              {s.replace('x', ' x ')}
            </button>
          ))}
        </div>

        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="spin" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
              Generating...
            </>
          ) : (
            'Generate Image'
          )}
        </button>

        {error && (
          <div style={{ color: '#ef4444', marginTop: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        {generatedImage && (
          <div className="generated-image">
            <img src={generatedImage} alt="Generated" />
            {revisedPrompt && (
              <p className="revised-prompt">
                <strong>Revised prompt:</strong> {revisedPrompt}
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ImageModal;
