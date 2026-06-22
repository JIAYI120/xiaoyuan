import s from './Content.module.css';

function UserAgreement() {
  return (
    <>
      <h3 className={s.heading3}>校园平台用户服务协议</h3>
      <p className={s.p}><strong>更新日期：</strong>2026年6月1日</p>
      <p className={s.p}><strong>生效日期：</strong>2026年6月1日</p>
      <p className={s.pSpacious}>欢迎使用校园平台服务。请您仔细阅读本协议全部条款。当您勾选"同意"并完成注册或使用本服务时，即表示您已充分理解并同意接受本协议的约束。</p>

      <h4 className={s.heading4}>第一条 服务说明</h4>
      <p className={s.p}>校园平台（以下简称"本平台"）是一款面向在校师生的学习交流与资源共享工具，提供课程资料、学术讨论、社团活动等信息服务。本平台由虚拟科技有限公司运营。</p>

      <h4 className={s.heading4}>第二条 账号注册与安全</h4>
      <p className={s.pTight}>2.1 您应当提供真实、准确的注册信息，包括但不限于姓名、学号、邮箱等。</p>
      <p className={s.pTight}>2.2 您应妥善保管账号及密码，因保管不当造成的损失由您自行承担。</p>
      <p className={s.p}>2.3 如发现账号存在异常使用情况，请立即通知本平台。</p>

      <h4 className={s.heading4}>第三条 用户行为规范</h4>
      <p className={s.pTight}>您在使用本平台时，不得实施下列行为：</p>
      <p className={s.pTight}>• 发布违反法律法规的内容</p>
      <p className={s.pTight}>• 侵犯他人知识产权、隐私权等合法权益</p>
      <p className={s.pTight}>• 发布虚假、误导性信息</p>
      <p className={s.p}>• 任何可能破坏平台正常运行的行为</p>

      <h4 className={s.heading4}>第四条 知识产权</h4>
      <p className={s.p}>本平台提供的所有内容，包括但不限于文字、图片、音频、视频、软件等，均受知识产权法保护。未经明确授权，您不得复制、修改、发布或传播上述内容。</p>

      <h4 className={s.heading4}>第五条 免责声明</h4>
      <p className={s.p}>本平台不对因不可抗力、网络问题、第三方服务等造成的损失承担责任。您应自行判断使用本平台获取信息的可靠性。</p>

      <h4 className={s.heading4}>第六条 协议变更</h4>
      <p className={s.p}>本平台有权根据需要修改本协议，修改后的协议在平台上公布。如您在协议修改后继续使用本服务，即视为您接受修改后的协议。</p>

    </>
  );
}

export default UserAgreement;
