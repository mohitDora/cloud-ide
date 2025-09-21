import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { httpServerUrl, userId, } from "@/utils/constants";
import { File as FileIcon, Folder, Plus, Trash, Edit } from 'lucide-react';

interface File {
  name: string;
  type: "file" | "folder";
  fullpath: string;
  children?: File[];
}

interface Project {
  containerName: string;
  createdAt: string;
  fileTree: File[];
  name: string;
  projectId: string;
  template: string;
  userId: string;
}

interface FolderStructureProps {
  folderStructure: File[];
  setSelectedFilename: (filename: string) => void;
  onFileDelete: (path: string) => void;
  onFileRename: (oldPath: string, newName: string) => void;
  onFolderAdd: (parentPath: string) => void;
  onFileAdd: (parentPath: string) => void;
  currentFile: string
}
const FolderTree = ({
  folderStructure,
  setSelectedFilename,
  onFileDelete,
  onFileRename,
  onFolderAdd,
  onFileAdd,
  currentFile
}: FolderStructureProps) => {
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [newPath, setNewPath] = useState<string>("");
  const [openFolders, setOpenFolders] = useState<string[]>([]);

  const handleRename = (item: File) => {
    setEditingPath(item.fullpath);
    setNewPath(item.name);
  };

  const handleSaveRename = (e: React.KeyboardEvent, oldPath: string) => {
    if (e.key === "Enter") {
      onFileRename(oldPath, newPath);
      setEditingPath(null);
    }
  };

  const handleToggle = (path: string) => {
    setOpenFolders((prev) => {
      if (prev.includes(path)) {
        return prev.filter((p) => p !== path);
      } else {
        return [...prev, path];
      }
    })
  };

  return (
    <div className="px-2">
      {[...folderStructure]
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
          return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        }).map((item) => {
          return (
            <div key={item.fullpath} className="flex flex-col">
              <div className="flex items-center justify-between group">
                <div
                  className={`flex items-center flex-1 cursor-pointer truncate ${currentFile === item.fullpath ? "text-[#ecc48d]" : ""}`}
                  onClick={() => {
                    if (item.type === "folder") {
                      handleToggle(item.fullpath);
                    } else {
                      setSelectedFilename(item.fullpath);
                    }
                  }}
                >
                  {item.type === "file" ? (
                    <FileIcon className="inline mr-2 shrink-0" />
                  ) : (
                    <Folder
                      className={`inline mr-2 shrink-0 ${!openFolders.includes(item.fullpath) ? "text-[#ecc48d]" : "text-gray-400"
                        }`}
                    />
                  )}
                  {editingPath === item.fullpath ? (
                    <input
                      type="text"
                      value={newPath}
                      onChange={(e) => setNewPath(e.target.value)}
                      onKeyDown={(e) => handleSaveRename(e, item.fullpath)}
                      onBlur={() => setEditingPath(null)}
                      className="bg-gray-700 text-white rounded px-1 py-0.5 text-sm w-full"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate">{item.name}</span>
                  )}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.type === "folder" && (
                    <>
                      <button
                        onClick={() => onFolderAdd(item.fullpath)}
                        className="p-1 rounded hover:bg-gray-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onFileAdd(item.fullpath)}
                        className="p-1 rounded hover:bg-gray-600"
                      >
                        <FileIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => onFileDelete(item.fullpath)}
                    className="p-1 rounded hover:bg-gray-600"
                  >
                    <Trash className="w-4 h-4 text-red-400" />
                  </button>
                  <button
                    onClick={() => handleRename(item)}
                    className="p-1 rounded hover:bg-gray-600"
                  >
                    <Edit className="w-4 h-4 text-blue-400" />
                  </button>
                </div>
              </div>

              {!openFolders.includes(item.fullpath) && item.children && item.children.length > 0 && (
                <FolderTree
                  folderStructure={item.children}
                  currentFile={currentFile}
                  setSelectedFilename={setSelectedFilename}
                  onFileDelete={onFileDelete}
                  onFileRename={onFileRename}
                  onFolderAdd={onFolderAdd}
                  onFileAdd={onFileAdd}
                />
              )}
            </div>
          );
        })}
    </div>
  );
};



const Ide = () => {
  const { projectId } = useParams();

  const wsServerUrl = `ws://localhost:4000?userId=${userId}&projectId=${projectId}`;

  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [project, setProject] = useState<Project>({
    containerName: "",
    createdAt: "",
    fileTree: [],
    name: "",
    projectId: "",
    template: "",
    userId: "",
  });
  const [files, setFiles] = useState<File[]>([]);

  const terminalRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const [notFound, setNotFound] = useState(false);

  const getProjectById = async (userId: string, projectId: string) => {
    try {
      const res = await axios(`${httpServerUrl}/project?userId=${userId}&projectId=${projectId}`);
      if (!res.data.project) {
        setNotFound(true);
      } else {
        setProject(res.data.project);
      }
    } catch (err) {
      console.error("Invalid project:", err);
      setNotFound(true);
    }
  };

  useEffect(() => {
    if (!projectId) {
      setNotFound(true);
      return;
    }

    initializeTerminal();
    initializeWebSocket();
    getProjectById(userId, projectId);
    getFiles(userId, projectId);

    return () => {
      terminalInstanceRef.current?.dispose();
      wsRef.current?.close();
    };
  }, [projectId]);

  const getFileContent = useCallback(async (filepath: string) => {
    if (!filepath || !projectId) return;
    try {
      const res = await axios.get(`${httpServerUrl}/file-content`, {
        params: { userId, projectId, filepath },
      });
      setFileContent(res.data.fileContent);
    } catch (err) {
      console.error("Error fetching file content:", err);
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedFilename) {
      getFileContent(selectedFilename);
    }
  }, [selectedFilename, getFileContent]);

  const initializeWebSocket = () => {
    wsRef.current = new WebSocket(wsServerUrl);
    wsRef.current.onopen = () => {
      setIsWebSocketConnected(true);
      terminalInstanceRef.current?.writeln("\r\n🔗 Connected to server...");
    };

    wsRef.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "terminal:output") {
          terminalInstanceRef.current?.write(msg.data);
        }

        if (msg.type === "error") {
          terminalInstanceRef.current?.writeln(
            `\r\n\x1b[31m[ERROR]\x1b[0m ${msg.message}`
          );
        }
      } catch (err) {
        console.error(err);
        terminalInstanceRef.current?.write(event.data);
      }
    };
    wsRef.current.onerror = (err) => {
      terminalInstanceRef.current?.writeln(
        "\r\n\x1b[31m[WebSocket Error]\x1b[0m Connection failed"
      );
      console.error(err);
    };

    wsRef.current.onclose = () => {
      setIsWebSocketConnected(false);
      terminalInstanceRef.current?.writeln(
        "\r\n\x1b[31m[Disconnected]\x1b[0m Lost connection to server"
      );
    };
  };

  const getFiles = async (userId: string, projectId: string) => {
    if (!projectId) return;
    try {
      const res = await axios(`${httpServerUrl}/file-tree`, {
        params: { userId, projectId },
      });
      setFiles(res.data.fileTree || []);
    } catch (err) {
      console.error("Error fetching files:", err);
      setFiles([]);
    }
  };
  const terminalTheme = {
    background: "#1e1e2e",   // match editor background
    foreground: "#ffffff",   // default text
    cursor: "#ffcc00",       // match editor cursor
    black: "#1e1e2e",
    red: "#f78c6c",
    green: "#c3e88d",
    yellow: "#ffcc00",
    blue: "#82aaff",
    magenta: "#c792ea",
    cyan: "#89ddff",
    white: "#ffffff",
    brightBlack: "#545454",
    brightRed: "#ff5370",
    brightGreen: "#c3e88d",
    brightYellow: "#ffcb6b",
    brightBlue: "#82aaff",
    brightMagenta: "#c792ea",
    brightCyan: "#89ddff",
    brightWhite: "#ffffff",
  };

  const initializeTerminal = () => {
    if (terminalRef.current) {
      const terminal = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        theme: terminalTheme
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      terminal.open(terminalRef.current!);
      setTimeout(() => {
        fitAddon.fit();
      }, 0);

      terminal.writeln("Welcome to React + Xterm.js 🚀");

      terminal.onData((data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "terminal:input",
              input: data,
            })
          );
        }
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

  function debounce(func: (...args: unknown[]) => void, delay: number) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: unknown[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  }

  const sendFileUpdate = useMemo(
    () =>
      debounce((...args: unknown[]) => {
        const value = args[0] as string | undefined;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && selectedFilename) {
          wsRef.current.send(
            JSON.stringify({
              type: "file:update",
              userId,
              projectId,
              filePath: selectedFilename,
              content: value,
            })
          );
        }
      }, 2500),
    [projectId, selectedFilename]
  );

  const addFileOrFolder = async (path: string, type: "file" | "folder") => {
    if (!projectId) return;
    const newName = prompt(`Enter ${type} name:`);
    if (!newName) return;

    try {
      const newPath = path ? `${path}/${newName}` : newName;
      await axios.post(`${httpServerUrl}/file-tree`, null, {
        params: { userId, projectId, filepath: newPath, type },
      });
      getFiles(userId, projectId);
    } catch (err) {
      console.error(`Error creating ${type}:`, err);
    }
  };

  const deleteFileOrFolder = async (path: string) => {
    if (!projectId) return;
    if (!window.confirm(`Are you sure you want to delete ${path}?`)) return;

    try {
      await axios.delete(`${httpServerUrl}/file-tree`, {
        params: { userId, projectId, filepath: path },
      });
      getFiles(userId, projectId);
    } catch (err) {
      console.error("Error deleting file/folder:", err);
    }
  };

  const renameFileOrFolder = async (oldPath: string, newName: string) => {
    if (!projectId) return;
    try {
      const parentDir = oldPath.includes("/")
        ? oldPath.substring(0, oldPath.lastIndexOf("/"))
        : "";
      const newPath = parentDir ? `${parentDir}/${newName}` : newName;

      await axios.put(`${httpServerUrl}/file-tree`, null, {
        params: { userId, projectId, filepath: oldPath, newFilepath: newPath },
      });
      getFiles(userId, projectId);
    } catch (err) {
      console.error("Error renaming file/folder:", err);
    }
  };

  const myTheme = useMemo(() => ({
    base: "vs-dark", // must be "vs", "vs-dark", or "hc-black"
    inherit: true,   // use default + override
    rules: [
      { token: "comment", foreground: "#7ca0b0", fontStyle: "italic" },
      { token: "keyword", foreground: "#c792ea" },
      { token: "number", foreground: "#f78c6c" },
      { token: "string", foreground: "#ecc48d" },
    ],
    colors: {
      "editor.background": "#1e1e2e",
      "editor.lineHighlightBackground": "#2a2a3a",
      "editorCursor.foreground": "#ffcc00",
    },
  }), []);

  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme("myCustomTheme", myTheme);
    }
  }, [monaco, myTheme]);

  const extensionToLanguage = useMemo<Record<string, string>>(() => ({
    js: "javascript",
    ts: "typescript",
    jsx: "javascript",
    tsx: "typescript",
    json: "json",
    html: "html",
    css: "css",
    scss: "scss",
    md: "markdown",
    py: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    cs: "csharp",
    php: "php",
    rb: "ruby",
    go: "go",
    rs: "rust",
    sh: "shell",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
    txt: "plaintext",
  }), []);

  const getLanguage = useCallback((filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return extensionToLanguage[ext] || "plaintext";
  }, [extensionToLanguage]);
  const [language, setLanguage] = useState("plaintext");

  useEffect(() => {
    if (selectedFilename) {
      setLanguage(getLanguage(selectedFilename));
    }
  }, [selectedFilename, getLanguage]);


  if (notFound) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <p className="text-2xl">❌ Project not found</p>
      </div>
    );
  }


  return (
    <main className="flex h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} className="min-w-[250px] max-w-[400px] bg-[#1e1e2e] text-white p-4" >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Files</h2>
            <div className="flex gap-2">
              <button
                onClick={() => addFileOrFolder("", "folder")}
                className="p-1 hover:bg-gray-600 rounded"
              >
                <Folder className="inline" /> <Plus className="inline text-xs" />
              </button>
              <button
                onClick={() => addFileOrFolder("", "file")}
                className="p-1 hover:bg-gray-600 rounded"
              >
                <FileIcon className="inline" /> <Plus className="inline text-xs" />
              </button>
            </div>
          </div>
          <FolderTree
            folderStructure={files}
            setSelectedFilename={setSelectedFilename}
            currentFile={selectedFilename ?? ""}
            onFileDelete={deleteFileOrFolder}
            onFileRename={renameFileOrFolder}
            onFolderAdd={(parentPath) => addFileOrFolder(parentPath, "folder")}
            onFileAdd={(parentPath) => addFileOrFolder(parentPath, "file")}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50}>
              {selectedFilename ? (
                <MonacoEditor
                  height="100%"
                  language={language}
                  onMount={(editor) => {
                    editor.focus();
                  }}
                  theme="myCustomTheme"
                  value={fileContent}
                  onChange={(value) => {
                    setFileContent(value || "");
                    sendFileUpdate(value || "");
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: "on",
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-[#1e1e2e] text-white">
                  <p className="text-2xl">Select a file to start coding</p>
                </div>
              )}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel>
              <div
                id="terminal"
                ref={terminalRef}
                className="h-full w-full"
              ></div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
};

export default Ide;