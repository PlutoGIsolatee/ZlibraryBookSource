const m = p(),
    { wrapper, requestResponse, shellHTML } = m;


/**
 * 开发工具
 */
function tool() {
    return wrapper({
        func: function toolFn() {
            result.put("验证码", "1")
            java.upLoginData(result)
        },
        isUserCall: true
    });
}




/**
 *内置浏览器打开首页
 *使用已设置的cookie
 */
function enterSite() {
    java.startBrowser(m.baseUrl, "Zlibrary");
}

/**
 *内置浏览器打开当前页面
 */
function enterCurrent() {
    wrapper({
        func: function () {
            java.startBrowser(book?.bookUrl || null, source.getTag())
        },
        isUserCall: true,
        msg: "尝试打开当前网页，请确认是否在书籍详情页面"
    });
}

/**
 * 主登录函数；输入邮箱、密码; cookie备份到源变量
 * @return {java.lang.String} 正常：已登录信息; 报错：响应体报错信息
 */
function Login() {
    const email = m.log_email,
        password = m.log_password;

    return wrapper({
        isUserCall: true,
        msg: `尝试登录，邮箱：${email}，密码：${password}`,
        func: function loginFn() {
            var loginResponse = JSON.parse(
                shellHTML(
                    requestResponse({
                        relativePath: "/rpc.php",
                        body: `email=${email}&password=${password}&action=login&gg_json_mode=1`,
                        useWebView: true
                    })));
            if (loginResponse && !loginResponse.errors?.[0] && !loginResponse.error) {
                m.user_id = loginResponse.response.user_id;
                m.user_key = loginResponse.response.user_key;
                return `已登录\n邮箱：${email}`;
            }
            return "登录失败\n" + (loginResponse.error || loginResponse.errors?.[0]?.message || `未知错误`);
        }
    });
}

/**
 * 发送邮箱验证码
 * 目前发现请求体中存在网站通过js生成的rx值，经测试短期不变，镜像域名变换仍有效，尚不确定详细机制; 注册功能有问题联系源作者
 * @return {java.lang.String} 正常：已发送信息; 报错：响应体报错信息
 */
function sendCode() {
    const email = m.log_email,
        password = m.log_password,
        nickname = m.log_nickname;

    return wrapper({
        func: function sendCodeFn() {
            const sendCodeResponse = JSON.parse(
                shellHTML(
                    requestResponse({
                        relativePath: "/papi/user/verification/send-code",
                        body: `email=${email}&password=${password}&name=${nickname}&rx=215&action=registration`,
                        useWebView: true
                    })));
            if (sendCodeResponse.success) {
                return `验证码已发送至“${email}邮箱，请查收`;
            }
            return "发送失败\n" + (sendCodeResponse.error || `未知错误`);
        },
        msg: `尝试向“${email}”发送验证码`,
        isUserCall: true
    });
}

/**
 * 注册; cookie备份到源变量
 * @return {java.lang.String} 正常：已注册信息; 报错：响应体报错信息
 */
function register() {
    const email = m.log_email,
        password = m.log_password,
        nickname = m.log_nickname,
        code = m.log_verifyCode;

    return wrapper({
        func: function registerFn() {
            const registerResponse = JSON.parse(
                shellHTML(
                    requestResponse({
                        relativePath: `/rpc.php`,
                        body: `email=${email}&password=${password}&name=${nickname}&rx=215&action=registration&verifyCode=${code}&gg_json_mode=1`,
                        useWebView: true
                    })));
            if (registerResponse && !registerResponse.error && !registerResponse.errors?.[0]) {
                m.user_id = registerResponse.response.user_id;
                m.user_key = registerResponse.response.user_key;
                return `已注册登录\n邮箱：${email}\n昵称：${nickname}`;
            }
            return "注册失败\n" + (registerResponse.error || registerResponse.errors?.[0].message || `未知错误`);
        },
        msg: `尝试用“${email}”注册账号`,
        isUserCall: true
    });
}

/**
 * 切换青少年模式
 * @return {java.lang.String} 成功：已关闭/开启; 失败：报错信息
 * 日志输出响应体及返回值
 */
function switchTeenageMode() {
    const map1 = {
        "🔲": 0,
        "✅": 1
    },
        map2 = {
            "🔲": "关闭",
            "✅": "开启"
        },
        value = m.log_teenageMode;
    return wrapper({
        func: function switchTeenageModeFn() {
            var switchTeenageModeResponse = JSON.parse(
                shellHTML(
                    requestResponse({
                        relativePath: `/eapi/user/update?hide18plus=${map1[value]}&`,
                        useWebView: true
                    })));
            if (switchTeenageModeResponse.success) {
                return `已${map2[value]}隐藏18岁以上书籍`;
            }
            return "青少年模式切换失败\n" + (switchTeenageModeResponse?.error || switchTeenageModeResponse?.errors?.[0]?.message || "未知错误");
        },
        msg: `尝试${map2[value]}隐藏18岁以上书籍`,
        isUserCall: true
    });
}

/**
 * 切换关键词过滤；存储至源变量; 通过getBookInfoList()自定义函数筛选
 * @return {java.lang.String} 成功：已关闭/开启，关键词：xx；失败：报错提示
 */
function switchKeywordFilter() {
    const map1 = {
        "🔲": 0,
        "✅": 1
    },
        map2 = {
            "🔲": "关闭",
            "✅": "开启"
        },
        value = m.log_doFilter,
        contents = m.log_filterKeywords;
    return wrapper({
        func: function switchKeywordFilterFn() {
            const keywords = JSON.parse(contents);//通过action检查合法性
            if (map1[value] === 1) {
                m.doFilter = true;
                m.filter = keywords;
            } else {
                m.doFilter = false;
            }
            return `已${map2[value]}关键词过滤${m.doFilter ? ("\n过滤关键词：" + m.filter.join()) : ""}`;
        },
        isUserCall: true,
        msg: `尝试${map2[value]}关键词过滤${m.doFilter ? ("\n过滤关键词：" + m.filter.join()) : ""}`
    });
}

/**
 * 设置列表结果为空时是否打开网页
 */
function switchCheckWebpage() {
    const map1 = {
        "🔲": false,
        "✅": true
    },
        map2 = {
            "🔲": "关闭",
            "✅": "开启"
        };
    const check = m.log_doCheck;
    return wrapper({
        func: function switchCheckWebpageFn() {
            m.doCheck = map1[check];
            return `已${map2[check]}手动检查`;
        },
        isUserCall: true,
        msg: `尝试${map2[check]}手动检查`
    });
}


/**
 * 退出登录；清除cookie; 可从源变量恢复
 * @return {java.lang.String} 已清除
 */
function logout() {
    return wrapper({
        func: function logoutFn() {
            cookie.removeCookie(m.baseUrl);
            return "已清除登录cookie，可一键恢复";
        },
        isUserCall: true,
        msg: `尝试清除${m.baseUrl}的cookie`
    })
}

/**
 * 从源变量恢复登录
 * @return {java.lang.String} 已恢复
 */
function relog() {
    return wrapper({
        func: function relogFn() {
            cookie.setCookie(m.baseUrl,
                `remix_userkey=${m.user_key}; remix_userid=${m.user_id}; selectedSiteMode=books`);
            return "已恢复登录";
        },
        isUserCall: true,
        msg: "尝试恢复登录"
    });
}

/**
 * 切换网址；检查非空; 自动移接cookie
 * @return {java.lang.String} 为空：请填写; 非空：已切换
 */
function switchDomain() {
    const url = m.log_domain;
    return wrapper({
        func: function switchDomainFn() {
            logout();
            m.baseUrl = url;
            relog();
            return `网址已切换至${url}，原网址cookie已清除，新网址已自动继承登录状态`;
        },
        isUserCall: true,
        msg: `尝试切换至${url}`
    });
}

function login() { }