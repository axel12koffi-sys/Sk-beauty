<?php
/**
 * SK Beauty — réception des demandes de rendez-vous
 * Envoie la demande détaillée au salon (avec la photo d'inspiration en pièce jointe)
 * et une confirmation à la cliente si elle a donné son courriel.
 * Répond en JSON : {"ok":true,"ref":"SK-261026-4821"} ou {"ok":false,"error":"..."}
 */

/* ===================== CONFIGURATION ===================== */
const SALON_EMAIL = 'sikirouanrafathaaa@gmail.com';     // reçoit les demandes
const FROM_EMAIL  = 'noreply@skbeautysalon.com';     // créer cette adresse dans le cPanel Obambu
const SALON_NAME  = 'SK Beauty';
const SALON_PHONE = '(819) 635-3783';
const BOOKING_FEE = 20;
const MAX_FILE    = 5 * 1024 * 1024;                 // 5 Mo
const MIN_SECONDS_BETWEEN_SENDS = 30;                // anti-envois multiples
/* ========================================================= */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function reply(bool $ok, array $extra = [], int $code = 200): void {
    http_response_code($code);
    echo json_encode(array_merge(['ok' => $ok], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

function field(string $key, int $max = 200): string {
    $v = isset($_POST[$key]) && is_string($_POST[$key]) ? $_POST[$key] : '';
    $v = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v));
    return mb_substr($v, 0, $max);
}

function oneLine(string $v): string {
    return trim(preg_replace('/[\r\n]+/', ' ', $v));
}

function encodeHeader(string $v): string {
    return '=?UTF-8?B?' . base64_encode(oneLine($v)) . '?=';
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    reply(false, ['error' => 'Méthode non autorisée.'], 405);
}

// Même origine uniquement
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host   = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
if ($origin !== '' && strtolower((string) parse_url($origin, PHP_URL_HOST)) !== $host) {
    reply(false, ['error' => 'Origine refusée.'], 403);
}

// Pot de miel : un robot remplit ce champ
if (field('website') !== '') {
    reply(true, ['ref' => 'SK-' . date('ymd') . '-0000']);
}

// Limite simple d'envois
session_start();
$now = time();
if (!empty($_SESSION['sk_last_send']) && ($now - $_SESSION['sk_last_send']) < MIN_SECONDS_BETWEEN_SENDS) {
    reply(false, ['error' => 'Votre demande vient d\'être envoyée. Patientez quelques secondes.'], 429);
}

/* ---------- Lecture et validation ---------- */
$data = [
    'category' => oneLine(field('category', 40)),
    'style'    => oneLine(field('style', 80)),
    'length'   => oneLine(field('length', 40)),
    'size'     => oneLine(field('size', 40)),
    'hair'     => oneLine(field('hair', 80)),
    'date'     => oneLine(field('date', 10)),
    'dateLbl'  => oneLine(field('date_label', 60)),
    'time'     => oneLine(field('time', 5)),
    'name'     => oneLine(field('name', 100)),
    'phone'    => oneLine(field('phone', 30)),
    'email'    => oneLine(field('email', 150)),
    'notes'    => field('notes', 1000),
    'mode'     => field('mode', 30) === 'square_appointments' ? 'square_appointments' : 'payment_link',
];

$extras = [];
if (isset($_POST['extras']) && is_array($_POST['extras'])) {
    foreach (array_slice($_POST['extras'], 0, 5) as $x) {
        if (is_string($x)) $extras[] = oneLine(mb_substr(trim($x), 0, 80));
    }
}

$errors = [];
if ($data['style'] === '')                                   $errors[] = 'coiffure';
if ($data['name'] === '' || mb_strlen($data['name']) < 2)     $errors[] = 'nom';
if (strlen(preg_replace('/\D/', '', $data['phone'])) < 10)    $errors[] = 'téléphone';
if ($data['email'] !== '' && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) $errors[] = 'courriel';
if (field('accept') !== '1')                                  $errors[] = 'conditions';
if ($data['mode'] === 'payment_link') {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) $errors[] = 'date';
    if (!preg_match('/^\d{2}:\d{2}$/', $data['time']))       $errors[] = 'heure';
}
if ($errors) {
    reply(false, ['error' => 'Champs à vérifier : ' . implode(', ', $errors) . '.'], 422);
}

/* ---------- Photo d'inspiration (facultative) ---------- */
$attachment = null;
if (!empty($_FILES['photo']) && ($_FILES['photo']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $f = $_FILES['photo'];
    if ($f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
        reply(false, ['error' => 'La photo n\'a pas pu être envoyée.'], 422);
    }
    if ($f['size'] > MAX_FILE) {
        reply(false, ['error' => 'La photo dépasse 5 Mo.'], 422);
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($f['tmp_name']);
    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/heic' => 'heic', 'image/heif' => 'heic'];
    if (!isset($allowed[$mime])) {
        reply(false, ['error' => 'La photo doit être au format JPG, PNG ou WEBP.'], 422);
    }
    $attachment = [
        'name' => 'inspiration.' . $allowed[$mime],
        'mime' => $mime,
        'data' => file_get_contents($f['tmp_name']),
    ];
}

/* ---------- Référence ---------- */
$ref = 'SK-' . date('ymd') . '-' . random_int(1000, 9999);

/* ---------- Courriel au salon ---------- */
$e = fn(string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
$rows = [
    'Référence'    => $ref,
    'Pour'         => $data['category'],
    'Coiffure'     => $data['style'],
    'Longueur'     => $data['length'],
    'Grosseur'     => $data['size'],
    'Mèches'       => $data['hair'],
    'Options'      => $extras ? implode(', ', $extras) : 'Aucune',
    'Date & heure' => $data['mode'] === 'square_appointments'
                        ? 'Choisies par la cliente sur Square Appointments'
                        : ($data['dateLbl'] ?: $data['date']) . ' à ' . $data['time'] . ' (souhait, à confirmer)',
    'Nom'          => $data['name'],
    'Téléphone'    => $data['phone'],
    'Courriel'     => $data['email'] ?: '—',
    'Précisions'   => $data['notes'] ?: '—',
    'Paiement'     => BOOKING_FEE . ' $ via ' . ($data['mode'] === 'square_appointments' ? 'Square Appointments' : 'lien de paiement Square') . ' — vérifier dans le tableau de bord Square',
];

$html = '<div style="font-family:Arial,sans-serif;font-size:15px;color:#1E140E">'
      . '<h2 style="margin:0 0 12px">Nouvelle demande de rendez-vous</h2>'
      . '<table cellpadding="8" style="border-collapse:collapse">';
foreach ($rows as $k => $v) {
    $html .= '<tr><td style="border-bottom:1px solid #EADCC8;color:#5E4A3C;vertical-align:top">' . $e($k) . '</td>'
           . '<td style="border-bottom:1px solid #EADCC8;font-weight:bold">' . nl2br($e($v)) . '</td></tr>';
}
$html .= '</table>';
if ($attachment) $html .= '<p>Photo d\'inspiration en pièce jointe.</p>';
$html .= '</div>';

$text = "Nouvelle demande de rendez-vous\n\n";
foreach ($rows as $k => $v) $text .= $k . ' : ' . $v . "\n";

$replyTo = $data['email'] !== '' ? $data['email'] : SALON_EMAIL;
$subject = 'RDV ' . $ref . ' — ' . $data['style'] . ' — ' . $data['name'];

function sendMail(string $to, string $subject, string $text, string $html, string $replyTo, ?array $attachment): bool {
    $boundaryMixed = 'mix_' . bin2hex(random_bytes(8));
    $boundaryAlt   = 'alt_' . bin2hex(random_bytes(8));

    $headers  = 'From: ' . encodeHeader(SALON_NAME) . ' <' . FROM_EMAIL . ">\r\n";
    $headers .= 'Reply-To: ' . oneLine($replyTo) . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= 'Content-Type: multipart/mixed; boundary="' . $boundaryMixed . "\"\r\n";

    $body  = "--$boundaryMixed\r\n";
    $body .= "Content-Type: multipart/alternative; boundary=\"$boundaryAlt\"\r\n\r\n";
    $body .= "--$boundaryAlt\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n";
    $body .= chunk_split(base64_encode($text)) . "\r\n";
    $body .= "--$boundaryAlt\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n";
    $body .= chunk_split(base64_encode($html)) . "\r\n";
    $body .= "--$boundaryAlt--\r\n";

    if ($attachment) {
        $body .= "--$boundaryMixed\r\n";
        $body .= 'Content-Type: ' . $attachment['mime'] . '; name="' . $attachment['name'] . "\"\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n";
        $body .= 'Content-Disposition: attachment; filename="' . $attachment['name'] . "\"\r\n\r\n";
        $body .= chunk_split(base64_encode($attachment['data'])) . "\r\n";
    }
    $body .= "--$boundaryMixed--\r\n";

    return mail($to, encodeHeader($subject), $body, $headers, '-f' . FROM_EMAIL);
}

if (!sendMail(SALON_EMAIL, $subject, $text, $html, $replyTo, $attachment)) {
    reply(false, ['error' => 'Le courriel n\'a pas pu être envoyé.'], 500);
}

/* ---------- Confirmation à la cliente ---------- */
if ($data['email'] !== '') {
    $next = $data['mode'] === 'square_appointments'
        ? "Dernière étape : choisissez votre créneau et réglez les " . BOOKING_FEE . " $ de réservation sur la page Square (indiquez votre numéro $ref dans la note)."
        : "Dernière étape : réglez les " . BOOKING_FEE . " $ de réservation avec le lien Square. Le salon vous confirme ensuite votre rendez-vous.";
    $cText = "Bonjour " . $data['name'] . ",\n\nMerci ! Nous avons bien reçu votre demande ($ref) pour : " . $data['style'] . ".\n\n"
           . $next . "\n\nUne question ? Appelez-nous ou écrivez-nous sur WhatsApp au " . SALON_PHONE . ".\n\n— " . SALON_NAME;
    $cHtml = '<div style="font-family:Arial,sans-serif;font-size:15px;color:#1E140E;line-height:1.6">'
           . '<p>Bonjour ' . $e($data['name']) . ',</p>'
           . '<p>Merci ! Nous avons bien reçu votre demande <strong>' . $e($ref) . '</strong> pour : <strong>' . $e($data['style']) . '</strong>.</p>'
           . '<p>' . $e($next) . '</p>'
           . '<p>Une question ? Appelez-nous ou écrivez-nous sur WhatsApp au ' . $e(SALON_PHONE) . '.</p>'
           . '<p>— ' . $e(SALON_NAME) . '</p></div>';
    sendMail($data['email'], 'Votre demande de rendez-vous ' . $ref . ' — ' . SALON_NAME, $cText, $cHtml, SALON_EMAIL, null);
}

$_SESSION['sk_last_send'] = $now;
reply(true, ['ref' => $ref]);
