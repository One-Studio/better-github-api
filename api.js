"use strict";

/**
 * static files (404.html, sw.js, conf.js)
 */

//////////////////////////////////////////
//    以下是better-github-api的核心设置    //
//////////////////////////////////////////

//Workers部署的地址、链接
const ASSET_URL = "api2.one-studio.workers.dev";

//
const AUTH = '';

// 前缀，如果自定义路由为example.com/gh/*，将PREFIX改为 '/gh/'，注意，少一个杠都会错！
const PREFIX = "/";

// git使用cnpmjs镜像、分支文件使用jsDelivr镜像的开关，0为关闭，默认开启
const Config = {
  jsdelivr: 0,
  cnpmjs: 1,
};

//////////////////////////////////////////
// 以下是gh-proxy的核心代码，稍作修改适配API //
/////////////////////////////////////////

// 获取handleRequest对请求处理的结果
addEventListener("fetch", (event) => {
  event.respondWith(
      handleRequest(event.request).catch(
          (err) => new Response(err.stack, { status: 500 })
      )
  );
});

/** @type {RequestInit} */
const PREFLIGHT_INIT = {
  status: 204,
  headers: new Headers({
    "access-control-allow-origin": "*",
    "access-control-allow-methods":
        "GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS",
    "access-control-max-age": "1728000",
  }),
};

/**
 * @param {any} body
 * @param {number} status
 * @param {Object<string, string>} headers
 */
function makeRes(body, status = 200, headers = {}) {
  headers["access-control-allow-origin"] = "*";
  return new Response(body, { status, headers });
}

/**
 * @param {string} urlStr
 */
function newUrl(urlStr) {
  try {
    return new URL(urlStr);
  } catch (err) {
    return null;
  }
}


/**
 *
 * @param {URL} urlObj
 * @param {RequestInit} reqInit
 */
async function proxy(urlObj, reqInit, rawLen) {
  const res = await fetch(urlObj.href, reqInit);
  const resHdrOld = res.headers;
  const resHdrNew = new Headers(resHdrOld);

  // verify
  if (rawLen) {
    const newLen = resHdrOld.get("content-length") || "";
    const badLen = rawLen !== newLen;

    if (badLen) {
      return makeRes(res.body, 400, {
        "--error": `bad len: ${newLen}, except: ${rawLen}`,
        "access-control-expose-headers": "--error",
      });
    }
  }
  const status = res.status;
  resHdrNew.set("access-control-expose-headers", "*");
  resHdrNew.set("access-control-allow-origin", "*");

  resHdrNew.delete("content-security-policy");
  resHdrNew.delete("content-security-policy-report-only");
  resHdrNew.delete("clear-site-data");

  return new Response(res.body, {
    status,
    headers: resHdrNew,
  });
}

/**
 * @param {Request} req
 * @param {string} pathname
 */
function httpHandler(req, pathname) {
  const reqHdrRaw = req.headers;

  // preflight
  if (
      req.method === "OPTIONS" &&
      reqHdrRaw.has("access-control-request-headers")
  ) {
    return new Response(null, PREFLIGHT_INIT);
  }

  let rawLen = "";

  const reqHdrNew = new Headers(reqHdrRaw);

  let urlStr = pathname;
  if (urlStr.startsWith("github")) {
    urlStr = "https://" + urlStr;
  }
  const urlObj = newUrl(urlStr);

  /** @type {RequestInit} */
  const reqInit = {
    method: req.method,
    headers: reqHdrNew,
    redirect: "follow",
    body: req.body,
  };
  return proxy(urlObj, reqInit, rawLen);
}

/**
 * @param {Request} req
 * @param {string} path
 * @note 方法名修改为cdnHandler，参数增加req以返回请求，开头的几行删除
 */
async function cdnHandler(req, path) {
  const exp1 =
      /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:releases|archive)\/.*$/i;
  const exp2 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:blob)\/.*$/i;
  const exp3 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:info|git-).*$/i;
  const exp4 =
      /^(?:https?:\/\/)?raw\.githubusercontent\.com\/.+?\/.+?\/.+?\/.+$/i;
  const exp5 =
      /^(?:https?:\/\/)?gist\.(?:githubusercontent|github)\.com\/.+?\/.+?\/.+$/i;
  if (
      path.search(exp1) === 0 ||
      path.search(exp5) === 0 ||
      (!Config.cnpmjs && (path.search(exp3) === 0 || path.search(exp4) === 0))
  ) {
    return httpHandler(req, path);
  } else if (path.search(exp2) === 0) {
    if (Config.jsdelivr) {
      const newUrl = path
          .replace("/blob/", "@")
          .replace(/^(?:https?:\/\/)?github\.com/, "https://cdn.jsdelivr.net/gh");
      return Response.redirect(newUrl, 302);
    } else {
      path = path.replace("/blob/", "/raw/");
      return httpHandler(req, path);
    }
  } else if (path.search(exp3) === 0) {
    const newUrl = path.replace(
        /^(?:https?:\/\/)?github\.com/,
        "https://github.com.cnpmjs.org"
    );
    return Response.redirect(newUrl, 302);
  } else if (path.search(exp4) === 0) {
    const newUrl = path
        .replace(/(?<=com\/.+?\/.+?)\/(.+?\/)/, "@$1")
        .replace(
            /^(?:https?:\/\/)?raw\.githubusercontent\.com/,
            "https://cdn.jsdelivr.net/gh"
        );
    return Response.redirect(newUrl, 302);
  } else {
    return fetch(ASSET_URL + path);
  }
}

//////////////////////////////////////////
//    以下是better-github-api的核心代码    //
//////////////////////////////////////////

function getJsonLength(jsonData){
  var jsonLength = 0;
  for(var item in jsonData){
    jsonLength++;
  }
  return jsonLength;
}

/**
 * 列出当前的键值对信息
 * @param {Request} request
 * @param pathname
 * @returns {Promise<Response>}
 */
async function list(request, pathname) {
  return fetch(
      // 列举BUCKET所有键值对
      "https://upup.cool"
  );
}

/**
 * 获取Github Release API的结果
 * @param {string} owner
 * @param {string} repo
 * @param {string} version
 * @returns {Promise<any>}
 */
async function getReleaseInfo(owner, repo, version) {
  let req = "https://api.github.com/repos/" + owner + "/" + repo + "/releases";

  if (version === "latest") {
    req += "/latest";
  } else {
    req += "/tags/" + version;
  }

  //获得release信息
  return await fetch(req, {
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.92 Safari/537.36",
    },
  }).then(response => response.json()) // 解析结果为JSON;
}

/**
 * 获取GitHub Release的（最新）版本号
 * @param {string} owner
 * @param {string} repo
 * @param {string} version
 * @returns {string}
 */
async function getVersion(owner, repo, version) {
  const resp = await getReleaseInfo(owner, repo, version);
  // const resp = JSON.parse(info)
  return  resp.tag_name;
}

/**
 * 获取某个版本的源代码
 * @param request
 * @param {string} owner
 * @param {string} repo
 * @param {string} version
 * @returns {Response}
 */
async function getSource(request, owner, repo, version) {
  const ver = await getVersion(owner, repo, version)
  // console.log(ver)
  return  cdnHandler(request, "https://github.com/" + owner + "/" + repo + "/archive/refs/tags/" + ver + ".zip")
}

/**
 * 获取附件
 * @param request
 * @param {string} owner
 * @param {string} repo
 * @param {string} version
 * @param {string} filter
 * @returns {Response} TODO 统一返回格式
 */
async function getAssets(request, owner, repo, version, filter) {
  const resp = await getReleaseInfo(owner, repo, version);
  if (getJsonLength(resp.assets) === 0) {
    return new Response("failed to find assets.", {status: 400})
  }

  if (!filter) {
    if (getJsonLength(resp.assets) === 1) {
      return cdnHandler(request, resp.assets[0].browser_download_url);
    } else {
      return new Response("failed to handle more than 1 asset without filter.", {status: 400})
    }
  }

  const flt = filter.split("&")

  let target, count = 0;
  for (const asset of resp.assets) {
    const name = asset.name

    if ( (flt[1] === '' || name.search(flt[1]) !== -1 ) &&
         (flt[2] === '' || name.search(flt[2]) === -1 ) &&
         (flt[3] === '' || name.startsWith(flt[3]) ) &&
         (flt[4] === '' || name.endsWith(flt[4]) ) ) {
      target = asset.browser_download_url;
      count++;
    }

    if ( count > 1 ) {
      return new Response("failed to handle multiple assets matched with filter: " + flt, {status: 400})
    }
  }

  if (count <= 0) {
    return new Response("failed to find any matched assets with filter.", {status: 400})
  }

  //返回正确结果
  return cdnHandler(request, target);
}

/**
 * TODO 获取仓库的信息
 * @param request
 * @param {string} owner
 * @param {string} repo
 * @param {string} version
 * @returns {string}
 */
async function getInfo(request, owner, repo, version) {
  return  "https://github.com/" + owner + "/" + repo + "/archive/refs/tags/" + getVersion(owner, repo, version) + ".zip";
}

/**
 * 访问GitHub仓库信息
 * @param {Request} request
 * @param pathname
 * @returns {Promise<Response>}
 */
async function repo(request, pathname) {
  // 路径分隔 1=RepoOwner 2=RepoName 3...
  const strs = pathname.split("/");
  // console.log(strs)

  //判空+赋值
  if (strs[1] === '' || strs[1] === undefined || strs[2] === '' || strs[2] === undefined) {
    return new Response('invalid input of Repo Owner or Repo Name.', {status: 400});
  }
  const owner = strs[1], repo = strs[2];

  //版本号
  if( (strs[3] === '' || strs[3] === undefined || strs[3] === 'latest') && (strs[4] === '' || strs[4] === undefined) ){
    //获取最新版的唯一附件
    return getAssets(request, owner, repo, "latest", "")
  }

  //获取过滤后的唯一附件
  if ( strs[3].startsWith("&") && (strs[4] === '' || strs[4] === undefined) ) {
    return getAssets(request, owner, repo, "latest", strs[3]);
  }

  //同上
  if ( (strs[3] === 'latest' && strs[4].startsWith("&")) ) {
    return getAssets(request, owner, repo, "latest", strs[4]);
  }

  if ( (strs[3] === 'latest' && strs[4] === 'version') || (strs[3] === 'version') ) {
    //获取最新版本的版本号
    const version = await getVersion(owner, repo, "latest")
    return new Response(version)
  }

  if ( (strs[3] === 'latest' && strs[4] === 'source') || (strs[3] === 'source') ) {
    //获取最新版本的源码
    return getSource(request, owner, repo, "latest")
  }

  if ( (strs[3] === 'latest' && strs[4] === 'info') || (strs[3] === 'info') ) {
    //获取最新版本的信息
    const info = await getInfo(request, owner, repo, "latest")
    return new Response(info)
  }

  //指定标签的5种情况
  const tag_name = strs[3]
  if (strs[4] === '' || strs[4] === undefined) {
    //获取指定标签的唯一附件
    return getAssets(request, owner, repo, tag_name, "");
  }

  if (strs[4].startsWith("&")) {
    return getAssets(request, owner, repo,  tag_name, strs[4]);
  }

  if (strs[4] === 'source') {
    //获取指定标签的源代码
    return getSource(request, owner, repo, tag_name)
  }

  if (strs[4] === 'info') {
    //获取指定标签的信息
    return new Response(getInfo(request, owner, repo, tag_name))
  }

  if (strs[4] === 'version') {
    //获取指定标签的版本 P.S. 这个请求无意义
    return new Response("meaningless request for a version's version.", {status: 400});
  }

  return new Response("invalid input.", {status: 400});
}

/**
 * 使用KV键值对的简写访问仓库信息
 * @param {Request} request
 * @param pathname
 * @returns {Promise<Response>}
 */
async function get(request, pathname) {
  const resp = await KV.get("hlae");
  console.log(typeof(resp))
  const value = JSON.parse(resp);
  const repo = value.repo;
  const filter = value.filter;
  const info = value.info;
  const zh = info.zh_CN;

  console.log(repo, filter, info, zh);

  return new Response("OK");
}

/**
 * 获取已缓存的最新版本信息
 * @param {Request} request
 * @param pathname
 * @returns {Promise<Response>}
 */
async function bucket(request, pathname) {

  return  fetch("");
}

/**
 * 提交get的快速键值对，需要Auth认证
 * @param {Request} request
 * @param pathname
 * @returns {Promise<Response>}
 */
async function submit(request, pathname) {

  return  fetch("");
}

/**
 * 请求处理的主体
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  const { pathname } = new URL(request.url);

  //空请求返回主页
  if (pathname === '' || pathname === '/') {
    return Response.redirect("https://upup.cool", 302);
  }

  //列出当前的键值对信息
  if (pathname.startsWith("/list")) {
    return list(request, pathname)
  }

  //访问GitHub仓库信息
  if (pathname.startsWith("/repo")) {
    return repo(request, pathname.replace("/repo", ""))
  }

  //使用KV键值对的简写访问仓库信息
  if (pathname.startsWith("/get")) {
    return get(request, pathname)
  }

  //获取已缓存的最新版本信息
  if (pathname.startsWith("/bucket")) {
    return bucket(request, pathname)
  }

  //提交get的快速键值对，需要Auth认证
  if (pathname.startsWith("/submit")) {
    return submit(request, pathname)
  }

  return Response.redirect("https://upup.cool", 302);
}
