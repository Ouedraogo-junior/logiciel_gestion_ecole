<!DOCTYPE html>
<html>
<body>
<table style="width:100%; border-collapse: collapse;">
    @foreach ($cartes->chunk(2) as $ligne)
        <tr>
            @foreach ($ligne as $carte)
                <td style="width:50%; padding: 4mm; vertical-align: top;">
                    @include('cartes._carte', array_merge($carte, ['nomEcole' => $nomEcole]))
                </td>
            @endforeach
        </tr>
    @endforeach
</table>
</body>
</html>