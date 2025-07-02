import { useSearchParams } from "react-router-dom";
import PostList from "./PostList";
import PostView from "./PostView";

function App() {
  const [params] = useSearchParams();
  const postIndex = params.get("post");

  console.log("====", postIndex);

  return postIndex === null ? <PostList /> : <PostView index={Number(postIndex)} />;
}

export default App;