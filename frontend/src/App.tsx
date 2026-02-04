import { useState, useEffect, useRef } from "react";
import { socket } from "./socket";
import LoginScreen from "./components/LoginScreen";
import Toolbar from "./components/Toolbar";
import Canvas from "./components/Canvas";
import CursorOverlay from "./components/CursorOverlay";
import TextToolModal from "./components/TextToolModal";
import ChatPanel from "./components/ChatPanel";
import type { Message } from "./types/chat.types";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from 'react-modal';
import type {
  DrawEvent,
  CanvasState,
  Cursor,
  Shape,
  TextElement,
} from "./types/drawing.types";
import Minimap from "./components/Minimap";
import { clampZoom } from "./utils/canvasTransform";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [userId, setUserId] = useState("");
  const [userCount, setUserCount] = useState(1);
  const [error, setError] = useState("");
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [peerConnections, setPeerConnections] = useState<
    Map<string, RTCPeerConnection>
  >(new Map());
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [currentStrokeId, setCurrentStrokeId] = useState<string | null>(null);
  const [currentStrokeEvents, setCurrentStrokeEvents] = useState<DrawEvent[]>(
    [],
  );

  const [canvasState, setCanvasState] = useState<CanvasState>({
    isDrawing: false,
    currentColor: "#000000",
    brushSize: 5,
    tool: "pen",
    filled: false,
  });
  const showNotification = (
    message: string,
    type: "success" | "info" | "error",
  ) => {
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  const handleZoomIn = () => {
    setZoom((prev) => clampZoom(prev * 1.2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => clampZoom(prev / 1.2));
  };

  const handleResetView = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleUndo = () => {
    if (!isConnected || !roomId || !canUndo) return;

    socket.emit("undo", { roomId });
  };

  const handleRedo = () => {
    if (!isConnected || !roomId || !canRedo) return;

    socket.emit("redo", { roomId });
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to server");
      setIsConnected(true);
      setError("");
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
      setIsConnected(false);
      setError("Disconnected from server");
    });

    socket.on("error", (data: { message: string }) => {
      console.error("Error:", data.message);
      setError(data.message);
      setTimeout(() => setError(""), 5000);
    });

    socket.on("userJoined", (data: { username: string; userCount: number }) => {
      console.log(`👤 ${data.username} joined the room`);
      setUserCount(data.userCount);
      showNotification(`${data.username} joined`, "success");
    });

    socket.on("userLeft", (data: { username: string; userCount: number }) => {
      console.log(`👋 ${data.username} left the room`);
      setUserCount(data.userCount);
      showNotification(`${data.username} left`, "info");
    });

    socket.on("drawing", (drawEvent: DrawEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas = canvasRef.current as any;
      if (canvas && canvas.drawFromSocket) {
        canvas.drawFromSocket(drawEvent);
      }
    });

    socket.on("receiveMessage", (message: Message) => {
      console.log("💬 Message received:", message);

      setChatMessages((prev) => {
        // Agar yeh message ID pehle se exist karti hai toh skip kar do
        if (prev.some((m) => m.id === message.id)) {
          console.log("Duplicate message skipped:", message.id);
          return prev;
        }
        return [...prev, message];
      });

      // Unread count sirf tab badhao jab chat band hai
      if (!isChatOpen && message.username !== username) { // ✅ ADD username check
    setUnreadCount((prev) => prev + 1);
  }
    });

    socket.on("chatHistory", (messages: Message[]) => {
      console.log(`📜 Received ${messages.length} chat messages`);
      setChatMessages(messages);
    });

    socket.on("callRejected", () => {
      console.log("❌ Call rejected");
    });

    socket.on("callEnded", (data: { userId: string; username: string }) => {
      console.log(`📞 ${data.username} ended call`);
      const pc = peerConnections.get(data.userId);
      if (pc) {
        pc.close();
        setPeerConnections((prev) => {
          const newMap = new Map(prev);
          newMap.delete(data.userId);
          return newMap;
        });
      }
    });

    socket.on("shapeDrawn", (shape: Shape) => {
      console.log("🔷 Shape received:", shape);
      const canvas = canvasRef.current;
      if (canvas && (canvas as any).drawShapeFromSocket) {
        (canvas as any).drawShapeFromSocket(shape);
      }
    });

    socket.on("textAdded", (textElement: TextElement) => {
      console.log("📝 Text received:", textElement);
      const canvas = canvasRef.current;
      if (canvas && (canvas as any).drawTextFromSocket) {
        (canvas as any).drawTextFromSocket(textElement);
      }
    });

    socket.on("shapesHistory", (shapes: Shape[]) => {
      console.log(`🔷 Received ${shapes.length} shapes`);
      const canvas = canvasRef.current;
      if (canvas && (canvas as any).replayShapes) {
        setTimeout(() => {
          (canvas as any).replayShapes(shapes);
        }, 100);
      }
    });

    socket.on("textsHistory", (texts: TextElement[]) => {
      console.log(`📝 Received ${texts.length} texts`);
      const canvas = canvasRef.current;
      if (canvas && (canvas as any).replayTexts) {
        setTimeout(() => {
          (canvas as any).replayTexts(texts);
        }, 200);
      }
    });

    socket.on("canvasCleared", () => {
      console.log("🧹 Canvas cleared");
      const canvas = canvasRef.current;
      if (canvas && (canvas as any).clearCanvas) {
        (canvas as any).clearCanvas();
      }
      setCanUndo(false);
      setCanRedo(false);
      showNotification("Canvas cleared", "info");
    });

    socket.on("drawingHistory", (history: DrawEvent[]) => {
      console.log(`📜 Received drawing history:`, history);

      if (history.length === 0) {
        console.log("⚠️ No drawing history to replay");
        return;
      }

      const replayWithRetry = (retries = 5) => {
        const canvas = canvasRef.current;

        if (canvas && (canvas as any).replayHistory) {
          console.log("✅ Canvas ready, replaying history...");
          (canvas as any).replayHistory(history);
          setCanUndo(true);
        } else if (retries > 0) {
          setTimeout(() => replayWithRetry(retries - 1), 200);
        }
      };
      replayWithRetry();
    });

    socket.on(
      "undoPerformed",
      (data: { strokes: unknown[]; events: DrawEvent[] }) => {
        console.log("↩️ Undo performed");

        const canvas = canvasRef.current;
        if (canvas) {
          (canvas as any).clearCanvas();
          if (data.events.length > 0) {
            (canvas as any).replayHistory(data.events);
          }
        }

        setCanUndo(data.strokes.length > 0);
        setCanRedo(true);
      },
    );

    socket.on(
      "redoPerformed",
      (data: { strokes: unknown[]; events: DrawEvent[] }) => {
        console.log("↪️ Redo performed");

        const canvas = canvasRef.current;
        if (canvas) {
          (canvas as any).clearCanvas();
          (canvas as any).replayHistory(data.events);
        }

        setCanUndo(data.strokes.length > 0);
      },
    );

    socket.on(
      "cursorUpdate",
      (data: { userId: string; username: string; x: number; y: number }) => {
        console.log("🖱️ Cursor update received:", data);
        const colors = [
          "#FF6B6B",
          "#4ECDC4",
          "#45B7D1",
          "#FFA07A",
          "#98D8C8",
          "#F7DC6F",
          "#BB8FCE",
          "#85C1E2",
          "#F8B739",
          "#52B788",
        ];
        const colorIndex =
          data.userId
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        const color = colors[colorIndex];

        setCursors((prev) => ({
          ...prev,
          [data.userId]: {
            userId: data.userId,
            username: data.username,
            x: data.x,
            y: data.y,
            color: color,
          },
        }));
      },
    );

    socket.on("userLeft", (data: { username: string; userCount: number }) => {
      console.log(`👋 ${data.username} left the room`);
      setUserCount(data.userCount);

      setCursors((prev) => {
        const newCursors = { ...prev };
        Object.keys(newCursors).forEach((userId) => {
          if (newCursors[userId].username === data.username) {
            delete newCursors[userId];
          }
        });
        return newCursors;
      });

      showNotification(`${data.username} left`, "info");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("error");
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("drawing");
      socket.off("cursorUpdate");
      socket.off("canvasCleared");
      socket.off("drawingHistory");
      socket.off("undoPerformed");
      socket.off("redoPerformed");
      socket.off("shapeDrawn");
      socket.off("textAdded");
      socket.off("shapesHistory");
      socket.off("textsHistory");
      socket.off("receiveMessage");
      socket.off("chatHistory");
    };
  }, []);

  useEffect(() => {}, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        handleRedo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        handleResetView();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDrawShape = (shape: Omit<Shape, "id" | "timestamp">) => {
    if (!isConnected || !roomId) return;

    console.log("🔷 Drawing shape:", shape);

    socket.emit("drawShape", {
      roomId,
      ...shape,
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    const delta = e.deltaY;
    const zoomFactor = delta > 0 ? 0.9 : 1.1;

    setZoom((prev) => clampZoom(prev * zoomFactor));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
      e.preventDefault();
    }
  };

  const handleMouseMoveWithPan = (e: React.MouseEvent<HTMLDivElement>) => {
    handleMouseMove(e);
    if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
    }
  };

  const handleSendMessage = (text: string) => {
    if (!isConnected || !roomId) return;

    socket.emit("sendMessage", {
      roomId,
      message: text,
    });
  };

  const handleToggleChat = () => {
  setIsChatOpen((prev) => {
    const newOpen = !prev;
    if (newOpen) {
      setUnreadCount(0);
      console.log("Chat opened – unread reset to 0");
    }
    if (!isChatOpen) {
    setUnreadCount(0);
  }
    return newOpen;
  });
};

  const handleMouseUpPan = () => {
    setIsPanning(false);
  };

  const handleMinimapNavigate = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setPanX(-x * zoom + canvas.width / 2);
    setPanY(-y * zoom + canvas.height / 2);
  };

  const handleTextClick = (x: number, y: number) => {
    setTextPosition({ x, y });
    setIsTextModalOpen(true);
  };

  const handleAddText = (
    text: string,
    fontSize: number,
    fontFamily: string,
  ) => {
    if (!isConnected || !roomId) return;

    console.log("📝 Adding text:", { text, fontSize, fontFamily });

    socket.emit("addText", {
      roomId,
      text,
      x: textPosition.x,
      y: textPosition.y,
      fontSize,
      fontFamily,
      color: canvasState.currentColor,
    });
  };

  const handleFilledToggle = () => {
    setCanvasState((prev) => ({ ...prev, filled: !prev.filled }));
  };

  const handleCreateRoom = (roomName: string, username: string) => {
    setUsername(username);
    socket.connect();

    socket.emit(
      "createRoom",
      { roomName, username },
      (response: { roomId: string; userId: string; roomName: string }) => {
        setRoomId(response.roomId);
        setUserId(response.userId);
        setIsInRoom(true);
        showNotification(`Room created: ${response.roomId}`, "success");
      },
    );
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isConnected || !roomId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    socket.emit("cursorMove", { roomId, x, y });
  };

  const handleJoinRoom = (roomId: string, username: string) => {
    setUsername(username);
    socket.connect();

    socket.emit(
      "joinRoom",
      { roomId, username },
      (response: {
        success: boolean;
        userId: string;
        roomId: string;
        userCount: number;
      }) => {
        if (response && response.success) {
          setRoomId(response.roomId);
          setUserId(response.userId);
          setUserCount(response.userCount);
          setIsInRoom(true);
          showNotification(`Joined room: ${response.roomId}`, "success");
        }
      },
    );
  };

  const handleStrokeStart = () => {
    const strokeId = `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentStrokeId(strokeId);
    setCurrentStrokeEvents([]);

    socket.emit("startStroke", { roomId, strokeId });
  };

  const handleStrokeEnd = () => {
    if (currentStrokeId && currentStrokeEvents.length > 0) {
      socket.emit("endStroke", { roomId, strokeId: currentStrokeId });
      setCanUndo(true);
      setCanRedo(false);
    }

    setCurrentStrokeId(null);
    setCurrentStrokeEvents([]);
  };

  const handleDraw = (drawEvent: DrawEvent) => {
    if (!isConnected || !roomId) return;

    socket.emit("draw", {
      roomId,
      ...drawEvent,
    });

    setCurrentStrokeEvents((prev) => [...prev, drawEvent]);
  };

  const handleClearCanvas = () => {
    setIsClearModalOpen(true);  // modal kholo
  };

  const confirmClear = () => {
    if (!isConnected || !roomId) return;

    socket.emit("clearCanvas", { roomId });

    const canvas = canvasRef.current;
    if (canvas && (canvas as any).clearCanvas) {
      (canvas as any).clearCanvas();
    }

    setCanUndo(false);
    setCanRedo(false);
    setIsClearModalOpen(false);  // modal band karo
    toast.info("Canvas cleared for everyone", { position: "top-right" });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas && (canvas as any).downloadCanvas) {
      (canvas as any).downloadCanvas();
      toast.success("Canvas downloaded successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light", // ya "dark" agar dark mode hai
      });
    }
  };

  const handleColorChange = (color: string) => {
    setCanvasState((prev) => ({ ...prev, currentColor: color }));
  };

  const handleBrushSizeChange = (size: number) => {
    setCanvasState((prev) => ({ ...prev, brushSize: size }));
  };

  const handleToolChange = (tool: "pen" | "eraser") => {
    setCanvasState((prev) => ({ ...prev, tool }));
  };

  if (!isInRoom) {
    return (
      <LoginScreen
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#f8f9fc] text-gray-800 font-sans antialiased">
      {/* Error notification - modern toast style */}
      {error && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white px-6 py-3.5 rounded-xl shadow-2xl backdrop-blur-sm border border-red-700/30 animate-fade-in">
          ⚠️ {error}
        </div>
      )}

      {/* Connection status */}
      {!isConnected && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-amber-600/90 text-white px-6 py-3.5 rounded-xl shadow-2xl backdrop-blur-sm border border-amber-700/30 animate-pulse">
          🔄 Connecting to room...
        </div>
      )}

      <Modal
        isOpen={isClearModalOpen}
        onRequestClose={() => setIsClearModalOpen(false)}
        className="fixed inset-0 flex items-center justify-center z-50"
        overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm"
        ariaHideApp={false}  // important for accessibility
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Clear Canvas?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This will clear the canvas for everyone in the room. Are you sure?
          </p>
          <div className="flex gap-4 justify-end">
            <button
              onClick={() => setIsClearModalOpen(false)}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmClear}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
            >
              Yes, Clear
            </button>
          </div>
        </div>
      </Modal>

      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Toolbar - slim, elevated, glass-like */}
      <Toolbar
        canvasState={canvasState}
        onColorChange={handleColorChange}
        onBrushSizeChange={handleBrushSizeChange}
        onToolChange={handleToolChange}
        onClearCanvas={handleClearCanvas}
        onDownload={handleDownload}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        userCount={userCount}
        roomId={roomId}
        onFilledToggle={handleFilledToggle}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
      />

      {/* Main canvas wrapper - subtle grid background possible via css */}
      <div
        className="flex-1 relative overflow-hidden bg-white/60 shadow-inner"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
        onMouseMove={handleMouseMoveWithPan}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUpPan}
        onWheel={handleWheel}
      >
        <div
          className="absolute inset-0 transition-transform duration-150 ease-out"
        >
          <Canvas
            currentColor={canvasState.currentColor}
            brushSize={canvasState.brushSize}
            tool={canvasState.tool}
            filled={canvasState.filled}
            zoom={zoom}
            panX={panX}
            panY={panY}
            onDraw={handleDraw}
            onStrokeStart={handleStrokeStart}
            onStrokeEnd={handleStrokeEnd}
            onDrawShape={handleDrawShape}
            onTextClick={handleTextClick}
            onDrawingHistory={() => {}}
            ref={canvasRef}
          />
        </div>

        <CursorOverlay cursors={cursors} />
      </div>

      {/* Minimap - bottom right, subtle */}
      <Minimap
        canvasWidth={canvasRef.current?.width || 1920}
        canvasHeight={canvasRef.current?.height || 1080}
        viewportX={-panX / zoom}
        viewportY={-panY / zoom}
        viewportWidth={(canvasRef.current?.width || 1920) / zoom}
        viewportHeight={(canvasRef.current?.height || 1080) / zoom}
        zoom={zoom}
        onNavigate={handleMinimapNavigate}
      />

      {/* Text Modal - same but can style inside component */}
      <TextToolModal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        onAddText={handleAddText}
      />

      {/* Chat - side panel, modern look */}
      <ChatPanel
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        currentUsername={username}
        isOpen={isChatOpen}
        onToggle={handleToggleChat}
        unreadCount={unreadCount}
      />

      {/* Bottom user badge - clean pill */}
      <div className="fixed bottom-5 left-5 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border border-gray-200/60 text-sm font-medium text-gray-700 flex items-center gap-2">
        <span className="text-green-500">●</span> {username}
      </div>
    </div>
  );
}

export default App;
