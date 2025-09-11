import MonacoEditor from '@monaco-editor/react';

const Ide = () => {
  return (
    <div>

        <MonacoEditor
                  height="100%"
                  language={'javascript'}
                  value={""}
                //   onChange={(value) => setFileContent(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                  }}
                />
    </div>
  )
}

export default Ide