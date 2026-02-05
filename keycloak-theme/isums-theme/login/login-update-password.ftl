<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true; section>
    <#if section = "header">
        <header class="header">
            <div class="logo">
                <img src="${url.resourcesPath}/img/logob.png" alt="ISUMS Logo" />
            </div>
            <h1 class="app-name">Đặt lại mật khẩu</h1>
            <p class="tagline">Vui lòng nhập mật khẩu mới của bạn</p>
        </header>
    <#elseif section = "form">
        <form id="kc-passwd-update-form" class="reset-form" action="${url.loginAction}" method="post">
            <input type="text" id="username" name="username" value="${username}" autocomplete="username" readonly="readonly" style="display:none;"/>
            <input type="password" id="password" name="password" autocomplete="current-password" style="display:none;"/>

            <div class="form-group">
                <label for="password-new">Mật khẩu mới</label>
                <div class="password-wrap">
                    <input type="password" id="password-new" name="password-new" class="input" autofocus autocomplete="new-password" placeholder="Mật khẩu mới" />
                    <button type="button" class="toggle-password" onclick="togglePasswordNew()" aria-label="Hiện/ẩn">👁</button>
                </div>
                <#if messagesPerField.existsError('password','password-confirm')>
                    <span class="input-error" aria-live="polite">
                        ${kcSanitize(messagesPerField.getFirstError('password','password-confirm'))?no_esc}
                    </span>
                </#if>
            </div>

            <div class="form-group">
                <label for="password-confirm">Xác nhận mật khẩu</label>
                <div class="password-wrap">
                    <input type="password" id="password-confirm" name="password-confirm" class="input" autocomplete="new-password" placeholder="Nhập lại mật khẩu" />
                    <button type="button" class="toggle-password" onclick="togglePasswordConfirm()" aria-label="Hiện/ẩn">👁</button>
                </div>
            </div>

            <div class="form-actions">
                <button type="submit" class="btn-login">Đổi mật khẩu</button>
            </div>
        </form>
        
        <script>
            function togglePasswordNew() {
                var x = document.getElementById("password-new");
                if (x.type === "password") { x.type = "text"; } else { x.type = "password"; }
            }
            function togglePasswordConfirm() {
                var x = document.getElementById("password-confirm");
                if (x.type === "password") { x.type = "text"; } else { x.type = "password"; }
            }
        </script>
    </#if>
</@layout.registrationLayout>
