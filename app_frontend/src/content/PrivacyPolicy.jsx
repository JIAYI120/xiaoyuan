import s from './Content.module.css';

function PrivacyPolicy() {
  return (
    <>
      <h3 className={s.heading3}>校园平台隐私政策</h3>
      <p className={s.p}><strong>更新日期：</strong>2026年6月1日</p>
      <p className={s.p}><strong>生效日期：</strong>2026年6月1日</p>
      <p className={s.pSpacious}>校园平台（以下简称"我们"）非常重视您的个人隐私。本隐私政策说明我们如何收集、使用、存储和保护您的个人信息。</p>

      <h4 className={s.heading4}>第一条 信息收集范围</h4>
      <p className={s.pTight}>我们可能收集以下信息：</p>
      <p className={s.pTight}>• 注册信息：用户名、邮箱地址</p>
      <p className={s.pTight}>• 设备信息：设备型号、操作系统</p>
      <p className={s.pTight}>• 使用数据：访问时间、操作日志</p>
      <p className={s.p}>• 其他您主动提供的信息</p>

      <h4 className={s.heading4}>第二条 信息使用目的</h4>
      <p className={s.pTight}>我们收集的信息将用于：</p>
      <p className={s.pTight}>• 提供和维护平台服务</p>
      <p className={s.pTight}>• 验证用户身份、保障账号安全</p>
      <p className={s.pTight}>• 优化用户体验、改进服务质量</p>
      <p className={s.p}>• 处理用户反馈和投诉</p>

      <h4 className={s.heading4}>第三条 信息存储与保护</h4>
      <p className={s.p}>您的个人信息将存储于安全的服务器中，我们采用加密传输、访问控制等技术手段保护信息安全。除法律要求外，我们不会向任何第三方提供您的个人信息。</p>

      <h4 className={s.heading4}>第四条 用户权利</h4>
      <p className={s.pTight}>您有权：</p>
      <p className={s.pTight}>• 查询、更正或删除您的个人信息</p>
      <p className={s.pTight}>• 撤回对个人信息处理的同意</p>
      <p className={s.pTight}>• 注销账号</p>
      <p className={s.p}>• 获取个人信息副本</p>

      <h4 className={s.heading4}>第五条 Cookie 使用</h4>
      <p className={s.p}>我们使用 Cookie 及类似技术来维持登录状态、记录偏好设置。您可以通过浏览器设置管理 Cookie。</p>

      <h4 className={s.heading4}>第六条 政策更新</h4>
      <p className={s.p}>我们可能会不时更新本隐私政策，更新后将在平台上公布。重大变更时我们会通过站内通知或邮件方式告知您。</p>

      <h4 className={s.heading4}>第七条 联系我们</h4>
      <p className={s.p}>如对本隐私政策有任何疑问，请通过平台内的反馈功能与我们联系。</p>

    </>
  );
}

export default PrivacyPolicy;
