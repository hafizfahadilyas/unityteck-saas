<?php
function extractDocx($path, $out) {
    $zip = new ZipArchive();
    if ($zip->open($path) === true) {
        $xml = $zip->getFromName('word/document.xml');
        $zip->close();
        $text = strip_tags(str_replace(['</w:p>', '</w:tr>'], ["\n", "\n"], $xml));
        file_put_contents($out, $text);
        echo "Extracted $out (" . strlen($text) . " bytes)\n";
    } else {
        echo "Failed to open $path\n";
    }
}

extractDocx('C:/Users/fahad/Downloads/مجلد جديد (8)/مجلد جديد (8)/Messaging Channels/الواتساب/WhatsApp_Message_Center_Composer_Templates_Developer_Requirements_EN.docx', 'whatsapp_doc1_requirements.txt');
extractDocx('C:/Users/fahad/Downloads/مجلد جديد (8)/مجلد جديد (8)/Messaging Channels/الواتساب/WhatsApp_Store_Management_Developer_Requirements_EN.docx', 'whatsapp_doc2_requirements.txt');
