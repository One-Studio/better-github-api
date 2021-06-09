"use strict";

/**
 * static files (404.html, sw.js, conf.js)
 */

//////////////////////////////////////////
//    以下是better-github-api的核心设置    //
//////////////////////////////////////////

//Workers部署的地址、链接
const ASSET_URL = "https://api.upup.cool/";

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
  return proxy(urlObj, reqInit, rawLen, 0);
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

//////////////////////////////////////////
//    以下是better-github-api的核心代码    //
//////////////////////////////////////////

/**
 * 请求处理的主体
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  const { pathname } = new URL(request.url);

  //返回主页
  if (pathname === '' || pathname === '/') {
    return fetch(
        "https://upup.cool"
    );
  }

  //列出当前的键值对信息
  if (pathname.startsWith("/list")) {
    return fetch(
        "https://github.com/advancedfx/advancedfx/releases/download/v2.116.0/hlae_2_116_0.zip"
    );
  }

  // 自定义
  if (pathname.startsWith("/repo")) {
    // 路径分隔后0是域名 1=repo/get/bucket 2=...
    var strs = pathname.split("/");

    if (strs.length < 5) {
      return new Response("invalid input for repo api.");
    }

    var owner, repo, version, req;
    owner = strs[2];
    repo = strs[3];
    version = strs[4];
    req = "https://api.github.com/repos/" + owner + "/" + repo + "/releases";

    if (version === "latest") {
      req += "/latest";
    } else {
      req += "/tag/" + version;
    }

    //获得release信息
    const resp = await fetch(req, {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.92 Safari/537.36",
      },
    }).then((response) => response.json()); // 解析结果为JSON

    //版本号
    const tag = resp.tag_name;
    const assets = resp.assets;

    if (assets.length === 1) {
      // return Response.redirect(cdn + assets[0].browser_download_url, 302);
      return cdnHandler(request, assets[0].browser_download_url);
    }

    return new Response(resp.tag_name);
  }

  //测试返回链接
  if (pathname.startsWith("/get")) {
    return fetch(
        "https://github.com/advancedfx/advancedfx/releases/download/v2.116.0/hlae_2_116_0.zip"
    );
  }

  //获取已缓存的最新版本信息
  if (pathname.startsWith("/bucket")) {
    return fetch(
        "https://github.com/advancedfx/advancedfx/releases/download/v2.116.0/hlae_2_116_0.zip"
    );
  }

  //提交get的快速键值对，需要Auth认证
  if (pathname.startsWith("/submit")) {
    return fetch(
        "https://github.com/advancedfx/advancedfx/releases/download/v2.116.0/hlae_2_116_0.zip"
    );
  }

  return fetch(
      "https://upup.cool"
  );
}














