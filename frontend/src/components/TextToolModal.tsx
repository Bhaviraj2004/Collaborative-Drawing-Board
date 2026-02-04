import { useState } from 'react';

interface TextToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddText: (text: string, fontSize: number, fontFamily: string) => void;
}

const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Comic Sans MS',
  'Impact',
];

const FONT_SIZES = [12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 72];

export default function TextToolModal({
  isOpen,
  onClose,
  onAddText,
}: TextToolModalProps) {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddText(text.trim(), fontSize, fontFamily);
      setText('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Add Text</h2>

        <form onSubmit={handleSubmit}>
          {/* Text Input */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your text here..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 mb-4 resize-none"
            rows={3}
            autoFocus
          />

          {/* Font Family */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Font Family
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Font Size: {fontSize}px
            </label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            >
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="mb-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Preview:</p>
            <div
              style={{
                fontFamily: fontFamily,
                fontSize: `${fontSize}px`,
                color: '#000',
              }}
            >
              {text || 'Your text here...'}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition"
            >
              Add Text
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}