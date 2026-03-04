using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Infrastructure.Pinata
{
    public class PinataOptions
    {
        public string BaseUrl { get; set; } = string.Empty;
        public string PinFileEndpoint { get; set; } = string.Empty;
    }
}