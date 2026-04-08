<#-- Giữ locale khi chuyển trang: LocaleBean dùng currentLanguageTag, không có .language. -->
<#macro isumsLinkUrl rawUrl><#assign _sep = rawUrl?contains("?")?then("&", "?")/><#assign _lc = (locale.currentLanguageTag)!'vi'/>${rawUrl}${_sep}kc_locale=${_lc?url('UTF-8')}&ui_locales=${_lc?url('UTF-8')}</#macro>

<#-- Giữ locale khi POST (quên MK / đặt lại MK) — không có thì Keycloak dùng locale mặc định realm. -->
<#macro isumsFormActionUrl rawAction><#assign _sep = rawAction?contains("?")?then("&", "?")/><#assign _lc = (locale.currentLanguageTag)!'vi'/>${rawAction}${_sep}kc_locale=${_lc?url('UTF-8')}&ui_locales=${_lc?url('UTF-8')}</#macro>

<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true>
<!DOCTYPE html>
<html lang="${locale.currentLanguageTag!'en'}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1, interactive-widget=resizes-content" />
    <title>${msg("loginPageTitle")}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link href="${url.resourcesPath}/css/login.css" rel="stylesheet" />
</head>
<body>
    <div class="container">
        <#nested "header">
        <main class="card">
            <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                <div class="alert alert-${message.type}">
                    ${kcSanitize(message.summary)?no_esc}
                </div>
            </#if>
            <#nested "form">
        </main>
    </div>
    <script src="${url.resourcesPath}/js/login.js"></script>
</body>
</html>
</#macro>
