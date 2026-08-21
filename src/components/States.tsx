export function LoadingState() { return <div className="state">Se încarcă datele…</div> }
export function EmptyState({ children }: { children: React.ReactNode }) { return <div className="state">{children}</div> }
export function ErrorState({ message, retry }: { message?: string; retry: () => void }) { return <div className="state error">{message || 'Nu s-au putut încărca datele.'}<button onClick={retry}>Reîncearcă</button></div> }
