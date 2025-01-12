namespace Trading.Domain.Models;

public record MyComment(Guid? Id, string Comment, DateTimeOffset? Date)
{
}
