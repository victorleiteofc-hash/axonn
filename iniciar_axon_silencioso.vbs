Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "c:\Users\victo\OneDrive\?rea de Trabalho\axon"
WshShell.Run "node dist/server.cjs", 0, False
WScript.Sleep 1500
WshShell.Run "http://localhost:3000"
