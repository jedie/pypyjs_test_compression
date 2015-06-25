$(document).ready(function() {
    var out = $("#output");
    function print(data) {
        out.append(data+"\n");
    }

    function get_archive(url) {
        print("Request url: '" + url + "'");

        $.ajax({
            url: url,
            dataType: 'native', // https://github.com/acigna/jquery-ajax-native
            xhrFields: {
              responseType: 'arraybuffer'
            },
            success: function(data) {
                // data == ArrayBuffer
                print("\n" + url + " loaded:");
//                print("result type: " + Object.prototype.toString.call(data));
                var compressed_bytes = data.byteLength
                var compressed_kb = compressed_bytes/1024;
                try {
                    var start_time = new Date;
                    data = pako.inflate(data); // https://github.com/nodeca/pako/
                    // data == Uint8Array
                    var duration = new Date() - start_time;
                } catch (err) {
                    print("deompress error: " + err);
                    console.log(err);
                    throw err;
                }
                var uncompressed_bytes = data.length
                var uncompressed_kb = uncompressed_bytes/1024;
                var rate = (uncompressed_kb/1024) / (duration/1000);
                msg = "Decompress " + compressed_kb.toFixed(1) + "KB";
                msg += " to: " + uncompressed_kb.toFixed(1) + " KB";
                msg += " in " + duration + " ms";
                msg += " - Data rate: " + rate.toFixed(1) + " MB/s"
                print(msg);

                var start_time = new Date;
                print("<table>");
                // https://github.com/antimatter15/untar.js/
                untar(data).forEach(function(file){
                    // file == TarLocalFile instance
                    // file.fileData == Uint8Array
                    print("<tr>");
                    print("<td>"+file.filename+"</td>");
                    print("<td>"+file.size + "bytes</td>");
                    print("<td>"+head_stringify(file.fileData, 60)+"</td>");
                    print("</tr>");
                })
                print("</table>");
                var duration = new Date() - start_time;
                print("(print output in " + duration + "ms)\n");
            }
        });
    }
    function get_module(module_name) {
        print("get_module("+module_name+")");
        var url="./download/"+module_name+".tar.gz";
        get_archive(url);
    }

    // Test:

    get_archive(url="./download/pypyjs.tar.gz");

    get_module(module_name = "HTMLParser");
    get_module(module_name = "MimeWriter");

//    get_module(module_name = "doesntexists");

});