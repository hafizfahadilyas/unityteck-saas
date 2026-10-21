<?php
$img1 = 'C:/Users/fahad/Downloads/مجلد جديد (8)/مجلد جديد (8)/Messaging Channels/الواتساب/لوحة تحكم واتساب لإدارة الرسائل والقوالب.png';
$info1 = getimagesize($img1);
echo "Img1: {$info1[0]}x{$info1[1]} ({$info1['mime']})\n";

$img2 = 'C:/Users/fahad/Downloads/مجلد جديد (8)/مجلد جديد (8)/Messaging Channels/الواتساب/لوحة إدارة واتساب للمتجر والأرقام.png';
$info2 = getimagesize($img2);
echo "Img2: {$info2[0]}x{$info2[1]} ({$info2['mime']})\n";
