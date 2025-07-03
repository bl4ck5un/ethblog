import * as UZIP from 'uzip';
import { marked } from 'marked';
import { parse } from 'yaml';


function parseFrontmatter(raw) {
    const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
    if (!match) {
        let content = raw;
        return { undefined, content };
    }

    const [, yamlText, content] = match;
    let frontmatter = parse(yamlText);
    return { frontmatter, content };
}


// this is the only config item; centralized fallback node to use, default w3eth.io
const CENTRALIZED_NODE = "w3eth.io";
const CHAIN_ID = "0x1"; // switch this if you want to provide a frontend to a chain that isn't eth mainnet

let blog_address = '0x410D91696Ee45da4BDdfaed06278038c7C1A84bC';
if (!is_address_valid(blog_address)) {
    throw new Error("Invalid blog address provided");
}

export async function setup_web3() {
    if (window.has_web3) {
        console.log("web3 ready");
        return; // return right away if already
    }

    if (typeof window.ethereum !== 'undefined') {
        // alert("We have detected a web3 wallet. You may be asked to unlock it to read this blog from the chain.\n\nTHIS BLOG WILL NEVER ASK YOU TO SIGN ANY TRANSACTIONS.");
        try {
            const address = await window.ethereum.enable();
            if (Array.isArray(address) && is_address_valid(address[0])) {
                window.has_web3 = true;
                console.log("window.has_web3 set");
            } else {
                throw new Error("Invalid wallet address");
            }
        } catch (err) {
            alert("Ethereum wallet handshake failed!");
            window.has_web3 = false;
        }
    }
}

// work function to call eth; only other function that touches wallet
async function eth_call(contract_address, hex_data) {
    const callData = {
        to: contract_address,
        data: hex_data,
        chainId: CHAIN_ID
    };

    return await window.ethereum.request({
        method: 'eth_call',
        params: [callData, 'latest'],
    });
}

// centralized fallback for the above
async function http_call(address, slug, unpack_array) {
    console.error("using http");
    // for some reason when you specify a return you get a json array so we must handle that
    var result = await fetch("https://" + address + "." + CENTRALIZED_NODE + "/" + slug);
    if (result.status !== 200) {
        throw new Error("There was an error calling the contract; make sure your node is up and the contract is a valid EthBlog contract, and that the post you are trying to access exists.</b><br><br>To see examples of how to load an ethblog, <a href='//github.com/pdaian/ethblog/blob/main/README.md'>read our docs</a>.<br><br>Error message: HTTP request returned status " + result.status);
    }
    if (unpack_array) return (await result.json())[0];
    return await result.text();
}

// check address format, ignoring checksum (later queries will fail anyway)
function is_address_valid(address) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return false;
    }
    return true;
}

// 3 minimal abi functions, easy 2 audit
function encode_int(value) {
    return value.toString(16).padStart(64, '0'); // Convert to hex and pad to 64 characters
}

function decode_int(value) {
    /* eslint-disable no-undef */
    return parseInt(BigInt(value).toString()); // Convert hex to int
    /* eslint-enable no-undef */
}

function decode_string(value) {
    if (typeof value !== 'string' || !/^0x[0-9a-fA-F]+$/.test(value)) {
        throw new Error('Invalid hex string format.');
    }

    // Remove the '0x' prefix and decode the hex string
    const hexWithoutPrefix = value.slice(2);

    // Convert hex to byte array
    const byteArray = [];
    for (let i = 0; i < hexWithoutPrefix.length; i += 2) {
        byteArray.push(String.fromCharCode(parseInt(hexWithoutPrefix.substr(i, 2), 16)));
    }

    // Join byte array to form the string
    const decodedString = byteArray.join('');

    // Remove null padding if present
    return decodedString.replace(/\0/g, '');
}

// minimal contract interaction functions, hard-coded function selectors (check em yourself!)
async function get_num_blog_posts(address) {
    var result = window.has_web3 ? await eth_call(address, "0x51df1253") : await http_call(address, "getNumPosts?returns=(uint256)", true);
    return decode_int(result);
}


// added by bl4ck5un -- decompress zip-base64-sha256
async function decompressZLBInline(escapedInput) {
    // Unescape the raw string
    let raw = escapedInput.trim();
    if (raw.startsWith('"') && raw.endsWith('"')) {
        raw = raw.slice(1, -1);
    }
    raw = raw.replace(/\\\\/g, "\\")
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"');

    // Parse header and body
    const lines = raw.split("\n");
    if (lines[0] !== "---") throw new Error("Invalid zlb: missing opening ---");
    const secondIdx = lines.indexOf("---", 1);
    if (secondIdx === -1) throw new Error("Invalid zlb: missing second ---");

    const headerLines = lines.slice(1, secondIdx);
    const b64 = lines.slice(secondIdx + 1).join("");
    const headers = Object.fromEntries(
        headerLines.map(line => line.split(": ").map(s => s.trim()))
    );

    if (headers.version !== "0" || headers.algorithm !== "zip-base64-sha256") {
        throw new Error("Unsupported version or algorithm");
    }

    // Decode ZIP
    const bin = atob(b64);
    const zipBytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    const files = UZIP.parse(zipBytes);

    const file = files["content.md"];
    if (!file) throw new Error("Missing content.md in archive");

    const content = new TextDecoder().decode(file);

    // SHA-256 verification
    const digest = await crypto.subtle.digest("SHA-256", file);
    const actualSha = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");

    return {
        content,
        expected: headers.sha256,
        actual: actualSha,
        shaMismatch: headers.sha256 !== actualSha
    };
}


async function get_post_html(address, num_post) {
    let post;
    if (window.has_web3) {
        post = await eth_call(address, "0x40731c24" + encode_int(num_post));
        if (post.length < 131) return ""; // empty post
        post = decode_string("0x" + post.slice(130));
    }
    else
        post = await http_call(address, "getPost/" + num_post, false)

    try {
        const result = await decompressZLBInline(post);
        post = result.shaMismatch
            ? `⚠️ SHA-256 mismatch!\nExpected: ${result.expected}\nActual:   ${result.actual}\n\n${result.content}`
            : result.content;
    } catch (err) {
        alert("❌ " + err.message);
    }

    let { frontmatter, content } = parseFrontmatter(post);
    if (!frontmatter) {
        return {
            "title": "",
            "author": "",
            "date": "",
            "content": marked.parse(content),
        }
    } else {
        return {
            "title": frontmatter.title,
            "author": frontmatter.author,
            "date": frontmatter.date,
            "content": marked.parse(content),
        }
    }


}

export async function getOnePost(postid) {
    return await get_post_html(blog_address, postid);
}

export async function getPosts() {
    // fetch total number of posts for contract
    var blog_posts = [...Array(await get_num_blog_posts(blog_address)).keys()].reverse();

    const posts = [];

    // loop through all posts, get post data from chain, parse and append it to the output html
    for (var i = 0; i < blog_posts.length; i++) {
        var post = await get_post_html(blog_address, blog_posts[i]);
        if (post["content"] === "") continue; // deleted/empty post
        posts.push({
            "id": blog_posts[i],
            "title": post["title"],
            "content": post["content"],
            "author": post["author"],
            "date": post["date"]
        })
    }

    return posts;
}