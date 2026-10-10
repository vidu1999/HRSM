import Link from "next/link";
import { Icon } from "@/components/icon";
import { DeleteDocumentButton, UploadDocumentButton } from "@/components/module-actions";
import { Avatar, PageHeading, SearchField, StatusPill } from "@/components/presentation";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { getDocuments } from "@/lib/services/modules";
import { listEmployeeOptions } from "@/lib/services/employees";

export const dynamic = "force-dynamic";
const TABS = ["all", "employee", "policy"] as const;
const CATEGORY_FILTER: Record<string, (category: string, employeeId: string | null) => boolean> = {
  all: () => true,
  employee: (_category, employeeId) => employeeId !== null,
  policy: (category, employeeId) => employeeId === null || category.toLowerCase().includes("policy"),
};

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ view?: string; search?: string }> }) {
  const session = await requireSession();
  const params = await searchParams;
  const view = TABS.includes(params.view as typeof TABS[number]) ? params.view as typeof TABS[number] : "all";
  const query = params.search?.trim().toLowerCase() ?? "";
  const [documents, employees] = await Promise.all([getDocuments(session), can(session, "documents:write") ? listEmployeeOptions(session) : Promise.resolve([])]);
  const filter = CATEGORY_FILTER[view];
  const rows = documents.filter((document) => filter(document.category, document.employeeId) && (!query || `${document.title} ${document.fileName} ${document.category} ${document.employeeName ?? ""}`.toLowerCase().includes(query)));
  const policies = documents.filter((document) => CATEGORY_FILTER.policy(document.category, document.employeeId)).length;
  const staffFiles = documents.filter((document) => document.employeeId !== null).length;

  return <>
    <PageHeading title="Documents" description="Employee records, company policies and HR files stored securely with their metadata." action={can(session, "documents:write") ? <UploadDocumentButton employees={employees} /> : undefined} />
    <section className="panel table-panel">
      <header className="panel-header"><div><h2>Document library</h2><p>{documents.length} file{documents.length === 1 ? "" : "s"} in your access scope</p></div><span className="panel-meta"><span className="legend-item"><i className="dot blue" />{staffFiles} employee files</span><span className="legend-item"><i className="dot green" />{policies} policies</span></span></header>
      <div className="table-search-row">
        <div className="module-tabs document-tabs">{TABS.map((tab) => <Link key={tab} href={tab === "all" ? "/documents" : `/documents?view=${tab}`} className={`module-tab${view === tab ? " active" : ""}`}>{tab === "all" ? "All documents" : tab === "employee" ? "Employee documents" : "Company policies"}<span className="tab-count">{tab === "all" ? documents.length : tab === "employee" ? staffFiles : policies}</span></Link>)}</div>
        <form className="documents-search" method="get"><input type="hidden" name="view" value={view} /><SearchField name="search" placeholder="Search documents..." defaultValue={params.search ?? ""} /><button className="button-secondary" type="submit"><Icon name="search" size={12} /> Search</button></form>
      </div>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Document name</th><th>Category</th><th>Employee</th><th>Size</th><th>Uploaded</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.length ? rows.map((document, index) => <tr key={document.id}>
        <td><span className="doc-name"><span className="file-type"><Icon name="file" size={14} /></span><span><strong>{document.title}</strong><small>{document.fileName}</small></span></span></td>
        <td>{document.category}</td><td>{document.employeeName ? <span className="table-person"><Avatar name={document.employeeName} index={index} /><span className="person-cell-copy"><strong>{document.employeeName}</strong><small>Employee record</small></span></span> : <span className="muted-cell">Company-wide</span>}</td>
        <td>{fileSize(document.sizeBytes)}</td><td>{formatDate(document.createdAt)}</td><td><StatusPill status="ACTIVE" /></td>
        <td><div className="action-menu"><a className="row-action blue-action" href={`/api/documents/${document.id}/download`} title="Download document" aria-label={`Download ${document.title}`}><Icon name="download" size={13} /></a>{can(session, "documents:write") && <DeleteDocumentButton id={document.id} title={document.title} />}</div></td>
      </tr>) : <tr><td className="empty-cell" colSpan={7}>No documents match this filter. Upload a document to get started.</td></tr>}</tbody></table></div>
      <footer className="safe-note"><Icon name="shield" size={13} /><span><strong>Secure storage.</strong> File bytes and metadata are stored in PostgreSQL, behind your HRMS login and role permissions. Uploads are limited to 2.5 MB in this demo.</span></footer>
    </section>
  </>;
}
