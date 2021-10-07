"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var micromatch_1 = __importDefault(require("micromatch"));
var unist_util_visit_1 = __importDefault(require("unist-util-visit"));
function getCacheKey(node) {
    return "remark-check-links-" + node.id + "-" + node.internal.contentDigest;
}
function getHeadingsMapKey(link, path) {
    var key = link;
    var hashIndex = link.indexOf('#');
    var hasHash = hashIndex !== -1;
    if (hasHash) {
        key = link.startsWith('#') ? path : link.slice(0, hashIndex);
    }
    return {
        key: key,
        hasHash: hasHash,
        hashIndex: hashIndex
    };
}
function createPathPrefixer(pathPrefix) {
    return function withPathPrefix(url) {
        var prefixed = pathPrefix + url;
        return prefixed.replace(/\/\//, '/');
    };
}
module.exports = function plugin(_a, _b) {
    var markdownAST = _a.markdownAST, markdownNode = _a.markdownNode, files = _a.files, getNode = _a.getNode, cache = _a.cache, getCache = _a.getCache, pathPrefix = _a.pathPrefix;
    var _c = _b === void 0 ? {} : _b, _d = _c.exceptions, exceptions = _d === void 0 ? [] : _d, _e = _c.ignore, ignore = _e === void 0 ? [] : _e, _f = _c.verbose, verbose = _f === void 0 ? true : _f;
    return __awaiter(this, void 0, void 0, function () {
        function visitor(node, index, parent) {
            if (parent.type === 'heading') {
                headings.push(parent.data.id);
                return;
            }
            if (node.url.startsWith('#') || /^\.{0,2}\//.test(node.url)) {
                links.push(__assign({}, node, { frontmatter: markdownNode.frontmatter }));
            }
        }
        var links, headings, withPathPrefix, parent, setAt, linksMap, headingsMap, _i, files_1, file, key, visited, mdxCache, totalBrokenLinks, prefixedIgnore, prefixedExceptions, _loop_1, path, message;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    if (!markdownNode.fields) {
                        // let the file pass if it has no fields
                        return [2 /*return*/, markdownAST];
                    }
                    links = [];
                    headings = [];
                    unist_util_visit_1["default"](markdownAST, 'link', visitor);
                    withPathPrefix = createPathPrefixer(pathPrefix);
                    return [4 /*yield*/, getNode(markdownNode.parent)];
                case 1:
                    parent = _g.sent();
                    setAt = Date.now();
                    cache.set(getCacheKey(parent), {
                        path: withPathPrefix(markdownNode.fields.slug),
                        links: links,
                        headings: headings,
                        setAt: setAt
                    });
                    linksMap = {};
                    headingsMap = {};
                    _i = 0, files_1 = files;
                    _g.label = 2;
                case 2:
                    if (!(_i < files_1.length)) return [3 /*break*/, 7];
                    file = files_1[_i];
                    if (!(/^mdx?$/.test(file.extension) &&
                        file.relativePath !== 'docs/README.md')) return [3 /*break*/, 6];
                    key = getCacheKey(file);
                    return [4 /*yield*/, cache.get(key)];
                case 3:
                    visited = _g.sent();
                    if (!(!visited && getCache)) return [3 /*break*/, 5];
                    mdxCache = getCache('gatsby-plugin-mdx');
                    return [4 /*yield*/, mdxCache.get(key)];
                case 4:
                    visited = _g.sent();
                    _g.label = 5;
                case 5:
                    if (visited && setAt >= visited.setAt) {
                        linksMap[visited.path] = visited.links;
                        headingsMap[visited.path] = visited.headings;
                        return [3 /*break*/, 6];
                    }
                    // don't continue if a page hasn't been visited yet
                    return [2 /*return*/];
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7:
                    totalBrokenLinks = 0;
                    prefixedIgnore = ignore.map(withPathPrefix);
                    prefixedExceptions = exceptions.map(withPathPrefix);
                    _loop_1 = function (path) {
                        if (micromatch_1["default"].isMatch(path, prefixedIgnore)) {
                            return "continue";
                        }
                        var linksForPath = linksMap[path];
                        if (linksForPath.length) {
                            var brokenLinks = linksForPath.filter(function (link) {
                                // return true for broken links, false = pass
                                var _a = getHeadingsMapKey(link.url, path), key = _a.key, hasHash = _a.hasHash, hashIndex = _a.hashIndex;
                                if (micromatch_1["default"].isMatch(key, prefixedExceptions)) {
                                    return false;
                                }
                                var headings = headingsMap[key];
                                if (headings) {
                                    if (hasHash) {
                                        var id = link.url.slice(hashIndex + 1);
                                        return !prefixedExceptions.includes(id) && !headings.includes(id);
                                    }
                                    return false;
                                }
                                return true;
                            });
                            var brokenLinkCount = brokenLinks.length;
                            totalBrokenLinks += brokenLinkCount;
                            if (brokenLinkCount && verbose) {
                                console.warn(brokenLinkCount + " broken links found on " + path);
                                for (var _i = 0, brokenLinks_1 = brokenLinks; _i < brokenLinks_1.length; _i++) {
                                    var link = brokenLinks_1[_i];
                                    var prefix = '-';
                                    if (link.position) {
                                        var _a = link.position.start, line = _a.line, column = _a.column;
                                        // account for the offset that frontmatter adds
                                        var offset = link.frontmatter
                                            ? Object.keys(link.frontmatter).length + 2
                                            : 0;
                                        prefix = [
                                            String(line + offset).padStart(3, ' '),
                                            String(column).padEnd(4, ' ')
                                        ].join(':');
                                    }
                                    console.warn(prefix + " " + link.url);
                                }
                                console.log('');
                            }
                        }
                    };
                    for (path in linksMap) {
                        _loop_1(path);
                    }
                    if (totalBrokenLinks) {
                        message = totalBrokenLinks + " broken links found";
                        if (process.env.NODE_ENV === 'production') {
                            // break builds with broken links before they get deployed for reals
                            throw new Error(message);
                        }
                        if (verbose) {
                            console.error(message);
                        }
                    }
                    else if (verbose) {
                        console.info('No broken links found');
                    }
                    return [2 /*return*/, markdownAST];
            }
        });
    });
};
