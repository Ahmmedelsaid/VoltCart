using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace VoltCart.Api.Infrastructure;

/// <summary>
/// Catches any exception that escapes a controller and turns it into a ProblemDetails
/// response (RFC 9457), so the client always gets the same JSON shape instead of a stack trace.
/// </summary>
public class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IHostEnvironment environment,
    IProblemDetailsService problemDetailsService
) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken
    )
    {
        var (status, title, detail) = exception switch
        {
            // Unique index violated (e.g. two requests created the same slug at the same time)
            DbUpdateException
            {
                InnerException: MySqlException { ErrorCode: MySqlErrorCode.DuplicateKeyEntry }
            } => (
                StatusCodes.Status409Conflict,
                "Conflict",
                "A record with the same unique value already exists."
            ),

            _ => (
                StatusCodes.Status500InternalServerError,
                "An unexpected error occurred.",
                // تفاصيل الخطأ بتظهر في Development بس، عمرها ما تظهر للعميل في الـ production
                environment.IsDevelopment()
                    ? exception.Message
                    : null
            ),
        };

        if (status >= StatusCodes.Status500InternalServerError)
            logger.LogError(
                exception,
                "Unhandled exception on {Method} {Path}",
                httpContext.Request.Method,
                httpContext.Request.Path
            );
        else
            logger.LogWarning(
                exception,
                "Handled exception on {Method} {Path}",
                httpContext.Request.Method,
                httpContext.Request.Path
            );

        httpContext.Response.StatusCode = status;

        return await problemDetailsService.TryWriteAsync(
            new ProblemDetailsContext
            {
                HttpContext = httpContext,
                Exception = exception,
                ProblemDetails = new ProblemDetails
                {
                    Status = status,
                    Title = title,
                    Detail = detail,
                },
            }
        );
    }
}
