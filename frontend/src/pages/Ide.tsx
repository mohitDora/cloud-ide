import MonacoEditor from "@monaco-editor/react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const userId = "mohit123";
const projectId = "1757830698167";

const wsServerUrl = `ws://localhost:4000/`;
const httpServerUrl = `http://localhost:3000/api`;

interface File {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: File[];
}

interface FolderStructureProps {
  folderStructure: File[];
}

const FolderTree = ({ folderStructure }: FolderStructureProps) => {
  return (
    <div className="px-2">
      {folderStructure.map((folder) => (
        <div key={folder.id} className="ml-4">
          {folder.name}
          {folder.children && <FolderTree folderStructure={folder.children} />}
        </div>
      ))}
    </div>
  );
};

const Ide = () => {
  const { id } = useParams();

  const ws = useRef<WebSocket | null>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([
    {
      id: "1",
      name: "src",
      type: "folder",
      children: [
        {
          id: "2",
          name: "index.ts",
          type: "file",
        },
      ],
    },
    {
      id: "3",
      name: "package.json",
      type: "file",
    },
    {
      id: "4",
      name: "public",
      type: "folder",
      children: [
        {
          id: "5",
          name: "logo.png",
          type: "file",
        },
      ],
    },
  ]);

  const terminalRef = useRef<HTMLDivElement | null>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(wsServerUrl);
    ws.current.onopen = () => {
      setIsWebSocketConnected(true);
    };

    ws.current.onmessage = (event) => {
      console.log(event.data);
    };

    getFileContent("main.js");

    return () => ws.current?.close();
  }, []);

  useEffect(() => {
    initializeTerminal();

    return () => {
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
      }
    };
  }, [id]);

  function debounce(func: (...args: any[]) => void, delay: number) {
    let timer: any;
    return (...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  }

  const getFiles = () => {
    setFiles([]);
  };

  const getFileContent = async (filepath: string) => {
    try {
      const res = await axios.get(`${httpServerUrl}/file-content`, {
        params: {
          userId,
          projectId,
          filepath,
        },
      });

      setFileContent(res.data.fileContent);
      console.log(res.data.fileContent);
    } catch (err) {
      console.log(err);
    }
  };

  const saveFile = () => {};

  const initializeTerminal = () => {
    if (terminalRef.current) {
      const terminal = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        theme: {
          background: "#1e1e1e",
          foreground: "#ffffff",
        },
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      terminal.open(terminalRef.current!);
      setTimeout(() => {
        fitAddon.fit();
      }, 0);

      terminal.writeln("Welcome to React + Xterm.js 🚀");

      terminal.onData((data) => {
        terminal.write(data);
      });

      terminalInstanceRef.current = terminal;

      const handleResize = () => {
        setTimeout(() => fitAddon.fit(), 100);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  };

  const connectWebSocket = () => {};

  const sendFileUpdate = useMemo(
    () =>
      debounce((value: string | undefined) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(
            JSON.stringify({
              type: "file:update",
              userId,
              projectId,
              filePath: "main.js",
              content: value,
            })
          );
        }
      }, 2500),
    [userId, projectId, selectedFile]
  );

  return (
    <main className="flex h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} className="max-w-[200px]">
          <FolderTree folderStructure={files} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50}>
              <MonacoEditor
                height="100%"
                language={"javascript"}
                onMount={(editor) => {
                  editor.focus();
                }}
                value={fileContent}
                onChange={(value) => {
                  setFileContent(value || "");
                  sendFileUpdate(value || "")}}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                }}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel>
              {/* <div> */}

              <div
                id="terminal"
                ref={terminalRef}
                className="h-full w-full"
              ></div>
              {/* </div> */}
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
};

export default Ide;
