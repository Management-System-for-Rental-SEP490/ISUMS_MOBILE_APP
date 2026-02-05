<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true; section>
    <#if section = "header">
        <header class="header">
            <div class="logo">
                <img src="${url.resourcesPath}/img/logob.png" alt="ISUMS Logo" />
            </div>
            <h1 class="app-name">Quên mật khẩu?</h1>
            <p class="tagline">Nhập email hoặc tên đăng nhập để khôi phục</p>
        </header>
    <#elseif section = "form">
        <form id="kc-reset-password-form" class="reset-form" action="${url.loginAction}" method="post">
            <div class="form-group">
                <label for="username">Email / Tên đăng nhập</label>
                <input type="text" id="username" name="username" class="input" autofocus value="${(auth.attemptedUsername!'')}" aria-invalid="<#if messagesPerField.existsError('username')>true</#if>" placeholder="Nhập email của bạn"/>
                
                <#if messagesPerField.existsError('username')>
                    <span id="input-error-username" class="input-error" aria-live="polite">
                        ${kcSanitize(messagesPerField.get('username'))?no_esc}
                    </span>
                </#if>
            </div>

            <div class="form-actions">
                <button type="submit" class="btn-login">Gửi xác nhận</button>
            </div>
            
            <div class="back-to-login">
                <a href="${url.loginUrl}">Quay lại đăng nhập</a>
            </div>
        </form>
    <#elseif section = "info">
        
    </#if>
</@layout.registrationLayout>
