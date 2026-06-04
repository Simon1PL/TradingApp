namespace Trading.Domain.Enums;

public enum Country
{
    None,
    World,
    Poland,
    USA,
    Germany,
    France,
    UK,
    Japan,
    China,
    Canada,
    Australia,
    Switzerland,
    Netherlands,
    Sweden,
    Norway,
    Finland,
    Denmark,
    Spain,
    Italy,
    Brazil,
    India,
    Russia
}

public static class CountryMapper
{
    public static bool TryParse(string? value, out Country country)
    {
        country = value?.Replace(" ", "", StringComparison.Ordinal).ToUpperInvariant() switch
        {
            "POLAND" or "PL" => Country.Poland,
            "USA" or "US" or "UNITEDSTATES" => Country.USA,
            "GERMANY" or "DE" => Country.Germany,
            "FRANCE" or "FR" => Country.France,
            "UK" or "UNITEDKINGDOM" => Country.UK,
            "JAPAN" or "JP" => Country.Japan,
            "CHINA" or "CN" => Country.China,
            "CANADA" or "CA" => Country.Canada,
            "AUSTRALIA" or "AU" => Country.Australia,
            "SWITZERLAND" or "CH" => Country.Switzerland,
            "NETHERLANDS" or "NL" => Country.Netherlands,
            "SWEDEN" or "SE" => Country.Sweden,
            "NORWAY" or "NO" => Country.Norway,
            "FINLAND" or "FI" => Country.Finland,
            "DENMARK" or "DK" => Country.Denmark,
            "SPAIN" or "ES" => Country.Spain,
            "ITALY" or "IT" => Country.Italy,
            "BRAZIL" or "BR" => Country.Brazil,
            "INDIA" or "IN" => Country.India,
            "RUSSIA" or "RU" => Country.Russia,
            "WORLD" => Country.World,
            _ => Country.None
        };

        return country != Country.None;
    }
}
