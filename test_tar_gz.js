// based on code from http://stackoverflow.com/questions/8211744/convert-time-interval-given-in-seconds-into-more-human-readable-form
function human_time(milliseconds) {
    var temp = Math.floor(milliseconds / 1000);
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        return minutes + 'min.'
    }
    var seconds = temp % 60;
    if (seconds) {
        return seconds + 'sec.'
    }
    return milliseconds + 'ms'
}

function head_stringify(data, count) {
    if (typeof data == "string") {
        var txt = data.slice(0,count)
    } else {
        var txt="";
        for (var i=0; i<count; i++) {
            txt += String.fromCharCode(data[i]);
        }
    }
    return JSON.stringify(txt)+"...";
}

$(document).ready(function() {
    var out = $("#output");
    function print(data) {
        out.append(data+"\n");
    }

    function load_file(f) {
//        print(JSON.stringify(f));
        print("\n\tfilename....: " + f.filename);
//        print("\tmode........: " + f.mode);
//        print("\tuid.........: " + f.uid);
//        print("\tgid.........: " + f.gid);
        print("\tlength......: " + f.length + " (data length:" + f.data.length + ")");
//        print("\tlastModified: " + f.lastModified);
//        print("\tcheckSum....: " + f.checkSum);
//        print("\tfileType....:" + f.fileType);
//        print("\tlinkName....: " + f.linkName);
        print("\tcontent.....: " + head_stringify(f.data, 60));
    }

    function get_archive(url) {
        GZip.load(
            url=url,
            onload=function(h) {
//                print(JSON.stringify(h));
                if (!h.filename) {
                    return;
                }
                print("\nloaded: " + h.filename);

                var tar = new TarGZ;
                var t = new Date;

                tar.parseTar(h.data.join(''));

                var elapsed = new Date() - t;
                print('deflated '+ h.outputSize +' bytes in ' + h.decompressionTime + ' ms');
                print('parsed tar in ' + elapsed + ' ms');

                tar.files.forEach(load_file);
            },
            onstream=function(h) {
                print(h.offset + " bytes downloaded...");
            },
            onerror=function(xhr, e, h) {
                if (h != 0) {
                    print("\nERROR:");
                    print("xhr:" + xhr);
                    print("error:" + e);
                    print("h:" + h);
                }
            }
        );
    }
    function get_module(module_name) {
        print("\nget_module("+module_name+")");

        var url="./download/"+module_name+".tar.gz";
        print("url: '" + url + "'");

        get_archive(url);
    }

    // Test:
    
    get_archive(url="./download/pypyjs.tar.gz");

    get_module(module_name = "HTMLParser");
    get_module(module_name = "MimeWriter");
//    get_module(module_name = "doesntexists");
});