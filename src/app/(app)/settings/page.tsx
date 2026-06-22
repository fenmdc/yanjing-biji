import { SearchApiKeySettings } from "@/components/search-api-key-settings";
import { PageHeader, Panel } from "@/components/ui";
import { requireCurrentUser } from "@/lib/auth";
import { listUserSearchApiKeys } from "@/lib/user-api-keys";

export default async function SettingsPage() {
  const user = await requireCurrentUser();
  const keys = await listUserSearchApiKeys(user.id);

  return (
    <div>
      <PageHeader
        title="设置"
        description="管理账户偏好与外部服务连接。API key 会加密保存，不会在页面中完整显示。"
      />

      <Panel className="p-5">
        <SearchApiKeySettings initialKeys={keys} />
      </Panel>
    </div>
  );
}
