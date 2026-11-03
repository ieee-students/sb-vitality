import { Link } from "react-router-dom";
import { ExportSteps } from "../components/ExportSteps";
import { useAppState } from "../state/AppState";

export function HelpPage() {
  const { model } = useAppState();
  return (
    <div className="page help-page">
      <div className="page-intro">
        <h1>How to export</h1>
        <p>
          IEEE Student Branch vitality data lives in Smartsheet and is filtered by volunteer role. Because
          this tool runs entirely in your browser without connecting to your Smartsheet account, you export
          your own CSV and open it here.
        </p>
      </div>
      <ExportSteps isHelpPage />
      <div className="help-actions">
        <Link className="button" to="/">
          {model ? "Back to analytics" : "Back to home"}
        </Link>
      </div>
    </div>
  );
}
