import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PostList from "./PostList";
import PostView from "./PostView";
import { setup_web3 } from "./ethblog";
import './App.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

function App() {
  const [params] = useSearchParams();
  const postIndex = params.get("post");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setup_web3()
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div className="container">
          <a className="navbar-brand" href="/">Hacking Decentralized</a>
          <span className="text-white">
            {window.has_web3 ? "🟢" : "🔴"}
          </span>

          {/* Toggler button */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Collapsible section */}
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link" href="/">Posts</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#author">Authors</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container">
        <div
          className="p-4 mb-4 text-white rounded shadow-sm"
          style={{
            background: "linear-gradient(135deg, #6f42c1, #0d6efd)",
          }}
        >
          <h2 className="mb-3">🚦Latest ideas and experiments from the frontier of decentralized tech</h2>
          <p className="mb-2">
            This blog lives <strong>on Ethereum</strong>.
            Posts are fetched from contract at <a
              href="https://etherscan.io/address/0x410D91696Ee45da4BDdfaed06278038c7C1A84bC"
              target="_blank"
              rel="noreferrer"
              className="text-white text-decoration-underline"
            >
              0x410D91....84bC
            </a> by your browser.
          </p>
        </div>
        {ready ? (
          <>
            {!window.has_web3 && (
              <div className="alert alert-danger">
                <strong>⚠️ No web3 wallet detected. Reading blockchain via a centralized proxy node.</strong><br />
                To load directly from the blockchain, install a Web3-enabled wallet (e.g., MetaMask) and refresh the page.
              </div>
            )}
            {postIndex === null ? <PostList /> : <PostView index={Number(postIndex)} />}
          </>) : (<p>🔌 Connecting to Web3...</p>)}
      </div>

      <footer className="bg-dark text-white text-center py-3 mt-5">
        <div className="container">
          <p className="mb-0">
            © {new Date().getFullYear()} Hacking Decentralized
          </p>
        </div>
      </footer>
    </>
  );
}

export default App;