import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PostList from "./PostList";
import PostView from "./PostView";
import { setup_web3 } from "./ethblog";
import './App.css';

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
          <span class="text-white">
            {window.has_web3 ? "🟢" : "🔴"}
          </span>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link" href="/">Posts</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#author">Author</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container">
        <div>
          <p><i class="subtext">This blog lives at <a href="https://etherscan.io/address/0x410D91696Ee45da4BDdfaed06278038c7C1A84bC">0x410D91696Ee45da4BDdfaed06278038c7C1A84bC</a> on Ethereum, powered by <a href="https://github.com/pdaian/ethblog/">ethblog</a>.</i></p>
        </div>
        {ready ? (
          <>
            {!window.has_web3 && (
              <div class="alert alert-danger">
                <strong>⚠️ You are currently viewing ethblog through a centralized proxy node.</strong><br />
                To load this post from the blockchain, <a href="https://docs.alchemy.com/docs/how-to-install-a-web3-wallet">install a web3-enabled wallet</a> and refresh the page.
              </div>
            )}
            {postIndex === null ? <PostList /> : <PostView index={Number(postIndex)} />}
          </>) : (<p>🔌 Connecting to Web3...</p>)}
      </div>

      <footer className="bg-dark text-white text-center py-3 mt-5">
        <div className="container">
          <p className="mb-0">
            © {new Date().getFullYear()} ethblog — Built with ❤️ on Ethereum
          </p>
        </div>
      </footer>
    </>
  );
}

export default App;