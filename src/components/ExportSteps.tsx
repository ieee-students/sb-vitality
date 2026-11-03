import { DASHBOARD_URL } from "../config/links";

export function ExportSteps({ isHelpPage = false }: { isHelpPage?: boolean }) {
  return (
    <ol className="steps">
      <li>
        <h3>Open your Smartsheet Dynamic View</h3>
        <p>
          Visit the{" "}
          <a href={DASHBOARD_URL} target="_blank" rel="noreferrer">
            Student Branch Vitality Dashboard
          </a>{" "}
          and open the Smartsheet Dynamic View that matches your IEEE volunteer role (sign in to Smartsheet
          if prompted). Smartsheet automatically filters the rows you are authorized to view, whether that is
          your section's Student Branches, all sections in your region, or all regions.
        </p>
      </li>
      <li>
        <h3>Export the report as a CSV</h3>
        <p>
          Once the table finishes loading in Dynamic View, use the download/export option in the toolbar to
          save the <code>.csv</code> file to your device. Because the export includes officer contact
          details, keep the file private and avoid saving it on a shared computer.
        </p>
      </li>
      <li>
        <h3>Load the CSV to view analytics</h3>
        <p>
          {isHelpPage ? (
            <>
              Drop the downloaded CSV on the <strong>Home</strong> page, or click{" "}
              <strong>Update data</strong> in the top bar to replace an existing file.
            </>
          ) : (
            <>
              Drop the downloaded CSV into the upload box on this page, or click{" "}
              <strong>Choose CSV</strong> to select it.
            </>
          )}{" "}
          Your browser processes the file locally, and nothing is ever uploaded to a server. The dashboard
          automatically adapts to the scope of your export and saves a copy in this browser until you click{" "}
          <strong>Remove local data</strong>.
        </p>
      </li>
    </ol>
  );
}
