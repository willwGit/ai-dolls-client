# Next Ai Friend

## 前提条件

- 管理员运行 `PowerShell`
- - 执行 **Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))**
- 配置环境变量
- - 在“系统变量”区域中，滚动查找`Path`变量并选择它，然后点击“编辑”。将 `C:\ProgramData\chocolatey\bin` 添加到环境变量中
- 执行 `choco install mkcert` 为系统安装 `mkcert`
- `mkcert localhost 127.0.0.1 ::1` 为 `localhost` 生成证书（得到`localhost+2-key`和`localhost+2`）`pem` 文件
- `mkcert -install`
- `start .` 打开当前文件夹，搜索 `localhost` 将 `localhost+2 localhost+2-key` 文件放在 `public`
- 运行 `yarn dev` 启动

## 启动命令：yarn dev
