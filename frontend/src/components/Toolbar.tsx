import type { CanvasState } from "../types/drawing.types";
import {
  Pencil,
  Eraser,
  Circle,
  Square,
  Minus,
  ArrowRight,
  Type,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Users,
} from "lucide-react";

interface ToolbarProps {
  canvasState: CanvasState;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onToolChange: (tool: CanvasState["tool"]) => void;
  onClearCanvas: () => void;
  onDownload: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  userCount: number;
  roomId: string;
  onFilledToggle?: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

const COLORS = [
  "#000000",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#FFFFFF",
];

export default function Toolbar({
  canvasState,
  onColorChange,
  onBrushSizeChange,
  onToolChange,
  onClearCanvas,
  onDownload,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  userCount,
  roomId,
  onFilledToggle,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
}: ToolbarProps) {
  const isShapeTool = ["circle", "rectangle", "line", "arrow"].includes(
    canvasState.tool,
  );
  const isActive = (tool: string) => canvasState.tool === tool;

  return (
    <div
      className={`
      sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 
      backdrop-blur-md border-b border-gray-200 dark:border-gray-800 
      shadow-sm transition-colors
    `}
    >
      <div className="max-w-screen-2xl mx-auto px-4 py-2.5 flex items-center gap-2 md:gap-4 flex-nowrap overflow-x-auto">
        {/* Room Info - Compact pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/30 rounded-full border border-purple-200 dark:border-purple-800/40 text-sm">
          <span className="font-medium text-purple-700 dark:text-purple-300">
            Room: {roomId}
          </span>
          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
            <Users className="w-4 h-4" />
            {userCount}
          </div>
        </div>

        {/* Drawing Tools */}
        <div className="flex gap-1">
          <button
            onClick={() => onToolChange("pen")}
            title="Pen (P)"
            className={`
              p-2 rounded-md transition-all
              ${
                isActive("pen")
                  ? "bg-purple-600 text-white shadow scale-105"
                  : "hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              }
            `}
          >
            <Pencil className="w-5 h-5" strokeWidth={2.2} />
          </button>
          <button
            onClick={() => onToolChange("eraser")}
            title="Eraser (E)"
            className={`
              p-2 rounded-md transition-all
              ${
                isActive("eraser")
                  ? "bg-purple-600 text-white shadow scale-105"
                  : "hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              }
            `}
          >
            <Eraser className="w-5 h-5" strokeWidth={2.2} />
          </button>
        </div>

        {/* Shapes */}
        <div className="flex gap-1 border-l border-gray-200 dark:border-gray-700 pl-3">
          <button
            title="Circle"
            onClick={() => onToolChange("circle")}
            className={`p-2 rounded-md transition-all ${isActive("circle") ? "bg-blue-600 text-white shadow scale-105" : "hover:bg-gray-200 dark:hover:bg-gray-800"}`}
          >
            <Circle className="w-5 h-5" strokeWidth={2} />
          </button>
          <button
            title="Rectangle"
            onClick={() => onToolChange("rectangle")}
            className={`p-2 rounded-md transition-all ${isActive("rectangle") ? "bg-blue-600 text-white shadow scale-105" : "hover:bg-gray-200 dark:hover:bg-gray-800"}`}
          >
            <Square className="w-5 h-5" strokeWidth={2} />
          </button>
          <button
            title="Line"
            onClick={() => onToolChange("line")}
            className={`p-2 rounded-md transition-all ${isActive("line") ? "bg-blue-600 text-white shadow scale-105" : "hover:bg-gray-200 dark:hover:bg-gray-800"}`}
          >
            <Minus className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <button
            title="Arrow"
            onClick={() => onToolChange("arrow")}
            className={`p-2 rounded-md transition-all ${isActive("arrow") ? "bg-blue-600 text-white shadow scale-105" : "hover:bg-gray-200 dark:hover:bg-gray-800"}`}
          >
            <ArrowRight className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Text */}
        <button
          title="Text (T)"
          onClick={() => onToolChange("text")}
          className={`p-2 rounded-md transition-all border-l border-gray-200 dark:border-gray-700 pl-3 ${isActive("text") ? "bg-green-600 text-white shadow scale-105" : "hover:bg-gray-200 dark:hover:bg-gray-800"}`}
        >
          <Type className="w-5 h-5" strokeWidth={2} />
        </button>

        {/* Fill Toggle */}
        {isShapeTool && onFilledToggle && (
          <label className="flex items-center gap-2 px-2 border-l border-gray-200 dark:border-gray-700 pl-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={canvasState.filled}
              onChange={onFilledToggle}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
              Fill
            </span>
          </label>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-3">
          <button
            title="Zoom Out (Ctrl+-)"
            onClick={onZoomOut}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <ZoomOut className="w-5 h-5" strokeWidth={2.2} />
          </button>
          <div className="px-2 py-1.5 min-w-[60px] text-center text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/70">
            {Math.round(zoom * 100)}%
          </div>
          <button
            title="Zoom In (Ctrl+=)"
            onClick={onZoomIn}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <ZoomIn className="w-5 h-5" strokeWidth={2.2} />
          </button>
          <button
            title="Reset (Ctrl+0)"
            onClick={onResetView}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <RotateCcw className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex gap-1 border-l border-gray-200 dark:border-gray-700 pl-3">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`p-2 rounded-md ${canUndo ? "hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700" : "opacity-40 cursor-not-allowed"}`}
          >
            <Undo2 className="w-5 h-5" strokeWidth={2.2} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={`p-2 rounded-md ${canRedo ? "hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700" : "opacity-40 cursor-not-allowed"}`}
          >
            <Redo2 className="w-5 h-5" strokeWidth={2.2} />
          </button>
        </div>

        {/* Color Picker - Compact */}
        <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-3">
          <div className="flex gap-1">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`
                  w-6 h-6 rounded-full border-2 transition-all
                  ${
                    canvasState.currentColor === color
                      ? "border-purple-500 scale-110 ring-2 ring-purple-300/50"
                      : "border-gray-300 dark:border-gray-600 hover:scale-110"
                  }
                `}
                style={{ backgroundColor: color }}
                title={color.toUpperCase()}
              />
            ))}
          </div>
        </div>

        {/* Brush Size - Compact */}
        <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-3 min-w-[140px]">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {isShapeTool ? "Stroke" : "Size"}
          </span>
          <input
            type="range"
            min="1"
            max="50"
            value={canvasState.brushSize}
            onChange={(e) => onBrushSizeChange(Number(e.target.value))}
            className="w-20 accent-purple-600"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
            {canvasState.brushSize}
          </span>
        </div>

        {/* Right Actions - Only Icons */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onClearCanvas}
            title="Clear Canvas"
            className="p-2.5 rounded-md bg-red-600 hover:bg-red-700 text-white transition shadow-sm"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={onDownload}
            title="Download"
            className="p-2.5 rounded-md bg-green-600 hover:bg-green-700 text-white transition shadow-sm"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
