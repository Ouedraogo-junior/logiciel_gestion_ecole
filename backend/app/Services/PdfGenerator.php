<?php

namespace App\Services;

use Mpdf\Mpdf;

class PdfGenerator
{
    public static function depuisVue(string $vue, array $donnees, array $optionsMpdf = []): Mpdf
    {
        $mpdf = new Mpdf(array_merge([
            'tempDir' => storage_path('app/mpdf-tmp'),
            'format' => 'A4',
            'default_font' => 'dejavusans', // gère correctement les accents français
        ], $optionsMpdf));

        $mpdf->WriteHTML(view($vue, $donnees)->render());

        return $mpdf;
    }
}