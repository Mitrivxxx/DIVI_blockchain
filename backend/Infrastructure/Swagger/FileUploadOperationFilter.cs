using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;


namespace backend.Infrastructure.Swagger;

public class FileUploadOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var formParams = context.ApiDescription.ParameterDescriptions
            .Where(p => p.Source == BindingSource.Form || p.Source == BindingSource.FormFile)
            .ToList();

        if (formParams.Count == 0)
        {
            return;
        }

        var schema = new OpenApiSchema
        {
            Type = "object",
            Properties = new Dictionary<string, OpenApiSchema>(),
            Required = new HashSet<string>()
        };

        foreach (var param in formParams)
        {
            var paramType = Nullable.GetUnderlyingType(param.Type) ?? param.Type;
            var isFile = paramType == typeof(IFormFile);

            if (isFile)
            {
                schema.Properties[param.Name] = new OpenApiSchema
                {
                    Type = "string",
                    Format = "binary"
                };
            }
            else
            {
                schema.Properties[param.Name] = MapSchema(paramType);
            }

            var isRequired = param.IsRequired || (param.ModelMetadata?.IsRequired ?? false);
            if (isRequired)
            {
                schema.Required.Add(param.Name);
            }
        }

        operation.RequestBody = new OpenApiRequestBody
        {
            Content =
            {
                ["multipart/form-data"] = new OpenApiMediaType
                {
                    Schema = schema
                }
            }
        };
    }

    private static OpenApiSchema MapSchema(Type paramType)
    {
        if (paramType == typeof(string))
        {
            return new OpenApiSchema { Type = "string" };
        }

        if (paramType == typeof(int))
        {
            return new OpenApiSchema { Type = "integer", Format = "int32" };
        }

        if (paramType == typeof(long))
        {
            return new OpenApiSchema { Type = "integer", Format = "int64" };
        }

        if (paramType == typeof(bool))
        {
            return new OpenApiSchema { Type = "boolean" };
        }

        if (paramType == typeof(float))
        {
            return new OpenApiSchema { Type = "number", Format = "float" };
        }

        if (paramType == typeof(double) || paramType == typeof(decimal))
        {
            return new OpenApiSchema { Type = "number", Format = "double" };
        }

        return new OpenApiSchema { Type = "string" };
    }
}