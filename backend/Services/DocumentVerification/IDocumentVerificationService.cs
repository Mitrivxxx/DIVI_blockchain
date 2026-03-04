using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.DTOs;
using Microsoft.AspNetCore.Http;

namespace backend.Services.DocumentVerification
{
    public interface IDocumentVerification
    {
		Task<DocumentVerificationResultDto> VerifyDocumentAsync(IFormFile file);

    }
}