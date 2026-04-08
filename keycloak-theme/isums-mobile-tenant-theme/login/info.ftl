<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
    <#if section = "header">
        <@layout.isumsSiteFooterV2 />
    <#elseif section = "aboveCard">
        <div class="reset-page-brand-above" role="banner">
            <div class="reset-brand-hero">
                <div class="logo reset-brand-hero-logo">
                    <img src="${url.resourcesPath}/img/logob.png" alt="" />
                </div>
                <span class="reset-brand-mark">${msg("appName")}</span>
            </div>
        </div>
    <#elseif section = "form">
        <div id="kc-info-message" class="reset-form">
            <p class="instruction">${kcSanitize(message.summary)?no_esc}<#if requiredActions??>: <#list requiredActions as reqActionItem><b>${kcSanitize(msg("requiredAction.${reqActionItem}"))?no_esc}</b><#sep>, </#sep></#list></#if></p>
            <#-- Không dùng client.baseUrl: admin thường đặt Root/Home = URL Keycloak → mở sai host. -->
            <#assign _rtu = msg("returnToAppUrl") />
            <#assign _appPrimary = "" />
            <#assign _appPrimaryIsProceed = false />
            <#if _rtu?contains("://")>
                <#assign _appPrimary = _rtu />
            <#elseif pageRedirectUri?has_content>
                <#assign _appPrimary = pageRedirectUri />
            <#elseif actionUri?has_content>
                <#assign _appPrimary = actionUri />
                <#assign _appPrimaryIsProceed = true />
            </#if>
            <#if skipLink??>
            <#elseif _appPrimary?has_content>
                <p class="form-actions"><a href="${_appPrimary}" class="btn-login" style="display:inline-block;text-align:center;text-decoration:none"><#if _appPrimaryIsProceed>${msg("proceedWithAction")}<#else>${msg("backToApplication")}</#if></a></p>
            </#if>
            <#if !_appPrimary?has_content>
            <div class="back-to-login">
                <#if message?? && message.type == 'success'>
                    <p class="instruction open-app-hint">${msg("openAppAfterPasswordSuccess")}</p>
                <#else>
                    <a href="<@layout.isumsLinkUrl rawUrl=url.loginUrl />" class="link-back">${msg("backToLogin")}</a>
                </#if>
            </div>
            </#if>
        </div>
        <#if message?? && message.type == 'success'>
        <script>
        (function () {
          try {
            if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function") {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: "isums_kc_info_success" }));
            }
          } catch (e) {}
        })();
        </script>
        </#if>
    </#if>
</@layout.registrationLayout>
