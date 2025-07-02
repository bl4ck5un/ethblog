import { useEffect, useState } from 'react';
import { getOnePost } from './ethblog';

function PostView({ index }) {
    const [post, setPost] = useState(null);

    useEffect(() => {
        const loadPost = async () => {
            const result = await getOnePost(index);
            setPost(result);
        };
        loadPost();
    }, [index]);

    if (!post) return <p>Loading post...</p>;

    return (
        <div>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="/">Posts</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Blog {index}</li>
                </ol>
            </nav>
            <div class="mt-2">
                <p dangerouslySetInnerHTML={{ __html: post }} />
            </div>
        </div>
    );
}

export default PostView;