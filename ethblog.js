// ethblog javascript library -- designed to be HUMAN READABLE and use 0 JAVASCRIPT OR WEB3 LIBRARIES


var body_html = "";

 // philosophically channeling https://randyperkins2k.medium.com/writing-a-simple-markdown-parser-using-javascript-1f2e9449a558
const parsed_markdown = (text) => {
	const toHTML = text
		.replace(/^### (.*$)/gim, '<h3>$1</h3>') // h3 tag
		.replace(/^## (.*$)/gim, '<h2>$1</h2>') // h2 tag
		.replace(/^# (.*$)/gim, '<h1>$1</h1>') // h1 tag
		.replace(/\*\*(.*)\*\*/gim, '<b>$1</b>') // bold text
		.replace(/\*(.*)\*/gim, '<i>$1</i>') // italic text
	return toHTML.trim(); // using trim method to remove whitespace
}


// boilerplate for the CSS/html header, all for prettifying
CSS_HEADER = `
<head>
<title>ethblog ~~ loading</title>
<style>
html *
{
   color: #000;
   font-family: Garamond;
}
h1 {
    text-align: center;
}
hr {
    border-top: 1px dotted gray;
    width: 70%;
    margin: auto;
}
.subtext {
    font-size: 0.5em;
    color: gray;
    text-align: center;
    display: block;
}
.post {
    width: 75%;
    text-align: justify;
    margin: auto;
}
.bigger {
    font-size: 1.5em;
}
</style>

</head>
<body>
`

// some boilerpate for title subscript and footer
ethblog_SUB = `<i class="subtext"> musings powered by <a href="https://github.com/pdaian/ethblog/">ethblog</a> and stored respecting your freedoms, forever* with the iron-clad guarantees of L1 </i>`
ethblog_FOOTER = `<i class="subtext"> to read about why ethblog is the most freedom-preserving way to publish, <a href="https://github.com/pdaian/ethblog/blob/main/README.md">read our docs</a>.<br><br>*forever not actually guaranteed and certainly never promised`


// work function to call eth; only other function that touches wallet
async function eth_call(contract_address, hex_data) {
    const callData = {
        to: contract_address,
        data: hex_data,
    };

    try {
        const result = await window.ethereum.request({
            method: 'eth_call',
            params: [callData, 'latest'],
        });
        console.log('Result:', result);
        return result;
    } catch (error) {
        alert('Error calling smart contract:', error);
    }
}

// check address format, ignoring checksum (later queries will fail anyway)
function is_address_valid(address) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        alert("You provided an invalid blog address! Reload this page with ?blog=[ethereum address] and try again");
        return false;
    }
    return true;
}

// don't allow users to input their own HTML
function escape_html(unsafe)
{
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}


// 3 minimal abi functions, easy 2 audit
function encode_int(value) {
    return value.toString(16).padStart(64, '0'); // Convert to hex and pad to 64 characters
}

function decode_int(value) {
    return parseInt(BigInt(value).toString()); // Convert hex to int
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
    return decode_int(await eth_call(address, "0x51df1253"));
}


async function get_post_html(address, num_post) {
    var post = await eth_call(address, "0x40731c24" + encode_int(0));
    post = decode_string("0x" + post.slice(130));
    post = parsed_markdown(escape_html(post));
    return post.replaceAll("\n", "<br>");
}

async function get_title(address) {
    var title = await eth_call(address, "0x4a79d50c");
    return decode_string("0x" + title.slice(130));
}




// mmain loop: connect to wallet, get number of posts, get posts from chain, display posts
async function run() {
    // display security warning
    alert("ONLY LOAD ADRESSES YOU TRUST INTO THIS SITE. You are trusting an address to display arbitrary HTML in your browser. If you do not trust an address or do not understand this, do not input it and CLOSE THIS PAGE BEFORE HITTING OK BELOW!\n\nTHIS WEBSITE WILL NEVER ASK YOU TO SIGN A TRANSACTION NOR WILL ANY LEGITIMATE BLOG");
    // get requsted blog address and check if the query is even sane
    query_string = window.location.search;
    url_params = new URLSearchParams(query_string);
    blog_address = url_params.get('blog');
    if (!is_address_valid(blog_address)) return;
    // connect to injected ethereum, confirm existence or error
    if (typeof ethereum !== 'undefined') {
        var address = await ethereum.enable();
    }
    else {
        alert('Please install an Ethereum wallet!');
        return;
    }
    if (!Array.isArray(address) || !is_address_valid(address)) {
        alert('Ethereum wallet handshake failed! Make sure you are logged into your wallet');
        return;
    }

    // build HTML with blog title
    var title = await get_title(blog_address);
    title = escape_html(title);
    document.title = "ethblog ~ " + title
    html = CSS_HEADER + "<br><div class='bigger'><h1>" + title + "</h1> " + ethblog_SUB + "</div><br><br>";

    // fetch total number of posts for contract
    num_blog_posts = await get_num_blog_posts(blog_address);

    // loop through all posts, get post data from chain, parse and append it to the output html
    for (i = 0; i < num_blog_posts; i++) {
        html += "<div class='post'>" + await get_post_html(blog_address, i) + "</div>";
        html += "<br><br><hr><br>";
    }
    if (num_blog_posts == 0) html += "<h2 style='text-align:center;'>no posts found :'( try posting something?</h2><br><br>"
    // add footer to output HTML
    html += "<div class='bigger'>" + ethblog_FOOTER + "</div>";
    body_html = html;
    // swap doc HTML to appropriate HTML, display page
    document.getRootNode().getRootNode().body.innerHTML = html;
}

// do the ~~work~~
// we love our entry points at ethblog
run();

