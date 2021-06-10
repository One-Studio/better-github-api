<h1 align="center">better-github-api</h1>

<p align="center">Better, Eazy, Access Anywhere</p>

   [![stars](https://img.shields.io/github/stars/One-Studio/better-github-api.svg?style=flat&color=green)](https://github.com/One-Studio/better-github-api
)
   [![fork](https://img.shields.io/github/forks/One-Studio/better-github-api.svg?style=flat&color=critical)](https://github.com/One-Studio/better-github-api)
   ![license](https://img.shields.io/badge/license-MIT%203-orange.svg?style=flat)
   [![donate](https://img.shields.io/badge/$-donate-ff69b4.svg?style=flat)](https://github.com/One-Studio/better-github-api#捐赠
)
   [![translation](https://img.shields.io/badge/$-translation-ff69b4.svg?style=flat&color=blueviolet)](https://github.com/One-Studio/better-github-api#翻译)

## 介绍

基于 [gh-proxy](https://github.com/hunshcn/gh-proxy) + [jsdelivr](https://www.jsdelivr.com/) + [cnpmjs](https://cnpmjs.org/) + [cloudflare workers](https://workers.cloudflare.com)  的 GitHub Serverless API 工具。

cdn.js是原项目单纯的CDN加速功能

api.js是本项目的核心，提供API服务

## 路线图

- [x] repo
- [x] get
- [ ] bucket
- [ ] submit
- [ ] list
- [ ] ...

## 部署与使用

Cloudflare Workers计费

到 `overview` 页面可参看使用情况。免费版每天有 10 万次免费请求，并且有每分钟1000次请求的限制。

如果不够用，可升级到 $5 的高级版本，每月可用 1000 万次请求（超出部分 $0.5/百万次请求）。

首页：

注册，登陆，`Start building`，取一个子域名，`Create a Worker`。

复制 [index.js](https://cdn.jsdelivr.net/hunshcn/gh-proxy@master/index.js)  到左侧代码框，`Save and deploy`。如果正常，右侧应显示首页。

`index.js`默认配置下clone走github.com.cnpmjs.org，项目文件会走jsDeliver，如需走worker，修改Config变量即可

`ASSET_URL`是静态资源的url（实际上就是现在显示出来的那个输入框单页面）

`PREFIX`是前缀，默认（根路径情况为"/"），如果自定义路由为example.com/gh/*，请将PREFIX改为 '/gh/'，注意，少一个杠都会错！

## API设计

KV（Key-Value）键值对：CloudFlare提供了免费1GB的键值对存储功能，可以设置多个命名空间，Workers可以读写这些键值对达到某种功能

### 一级API

| 参数    | 含义                                                    |
| ------- | ------------------------------------------------------- |
| /repo   | 获取GitHub仓库信息                                      |
| /get    | 利用KV中已有的键值对快速获取GitHub仓库信息              |
| /bucket | 与get类似，使用KV缓存的键值信息简化参数复杂度，加快响应 |
| /submit | 向KV提交键值对                                          |
| /list   | 列出KV键值对                                            |

### 二级API

### /repo

| API示例                                                  | 含义                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| /`仓库主`/`仓库名`/                                      | 同/`仓库主`/`仓库名`/latest，下面包含latest的API**同样适用**， |
| /`仓库主`/`仓库名`/`版本号`                              | 获取该仓库的`版本号`对应版本的唯一附件，附件>=1个时返回400错误 |
| /`仓库主`/`仓库名`/latest                                | 获取该仓库的最新版本的唯一附件，附件>=1个时返回400错误       |
| /`仓库主`/`仓库名`/latest/version                        | 获取该仓库的最新的版本号                                     |
| /`仓库主`/`仓库名`/latest/source                         | 获取该仓库的最新的源代码下载地址                             |
| /`仓库主`/`仓库名`/latest/info                           | 获取该仓库的最新的信息，包括版本号、更新内容、精简的附件信息和源代码下载地址 |
| /`仓库主`/`仓库名`/latest/&`包含`&`不包含`&`开头`&`结尾` | 获取该仓库的最新版本的附件，同时过滤附件名得到唯一附件，如&a&b&c&d代表附件名包含a、不包含d、开头为c结尾是d的附件，匹配的附件>=1个时返回400错误 |

- /info 返回JSON字符串结果，设计如下

| info    | 类型        | 含义      |
| ------- | ----------- | --------- |
| version | string      | 版本号    |
| source  | string      | 源代码URL |
| assets  | asset array | 附件      |
| log     | string      | 更新日志  |

| asset                | 类型   | 含义                                   |
| -------------------- | ------ | -------------------------------------- |
| name                 | string | 附件名                                 |
| size                 | int    | 附件大小                               |
| browser_download_url | string | 附件下载链接 （TODO 原始 or 加速后？） |

### /get

| API示例                                               | 含义                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| /get/`仓库简称`                                       | 获取该仓库的最新版本的唯一附件，使用KV存储的filter信息       |
| /get/`仓库简称`/`版本号`                              | 获取该仓库的`版本号`对应版本的附件，同样使用KV存储的filter信息 |
| /get/`仓库简称`/latest/version                        | 同repo处说明                                                 |
| /get/`仓库简称`/latest/source                         | 同repo处说明                                                 |
| /get/`仓库简称`/latest/info                           | 同repo处说明                                                 |
| /get/`仓库简称`/latest/&`包含`&`不包含`&`开头`&`结尾` | 同repo处说明，只是用这里给的filter                           |

至于KV里如何存`简称-全称`的对应关系

| 键     | 类型   | 例子                                                     |
| ------ | ------ | -------------------------------------------------------- |
| repo   | string | advancedfx/advancedfx                                    |
| filter | string | &hlae&&&.zip                                             |
| info   | object | {"zh_CN": "hlae的zip安装包", "zh_TW": "hlae的zip安裝器"} |

filter用`&`分隔的各个部分含义

| 键      | 含义       | 例   |
| ------- | ---------- | ---- |
| include | 包含字符串 | hlae |
| exclude | 排除字符串 |      |
| start   | 开头字符串 |      |
| end     | 结尾字符串 | .zip |

举例：键为 `hlae`，值为：

```
{
	"repo": "advancedfx/advancedfx",
	"filter": "&hlae&&&.zip",
	"info": {
		"zh_CN": "hlae的zip安装包",
		"zh_TW": "hlae的zip安裝包"
	}
}
```

之后使用URL如`https://api.upup.cool/get/hlae`即可直接下载hlae的最新zip安装包，同时包含CDN服务，避免了很多访问速度的问题。

### /bucket （未完成）

| API示例              | 含义               |
| -------------------- | ------------------ |
| /bucket              | 获取所有bucket信息 |
| /bucket/hlae         | 获取hlae最新安装包 |
| /bucket/hlae/version |                    |
| /bucket/ffmpeg/win/  |                    |
| /bucket/ffmpeg/win/  |                    |
| /get/hlae            |                    |

### /submit（未完成）

----

以下是原项目的相关内容

## 使用

- 分支源码：https://github.com/hunshcn/project/archive/master.zip
- release源码：https://github.com/hunshcn/project/archive/v0.1.0.tar.gz
- release文件：https://github.com/hunshcn/project/releases/download/v0.1.0/example.zip
- 分支文件：https://github.com/hunshcn/project/blob/master/filename
- commit文件：https://github.com/hunshcn/project/blob/1111111111111111111111111111/filename
- gist：https://gist.githubusercontent.com/cielpy/351557e6e465c12986419ac5a4dd2568/raw/cmd.py



## 链接

## 参考

## 捐赠
