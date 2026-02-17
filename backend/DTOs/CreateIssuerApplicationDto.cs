using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs
{
    public class CreateIssuerApplicationDto
    {
        public string InstitutionName { get; set; }
        public string EthereumAddress { get; set; }
        public string Email { get; set; }
        public string Description { get; set; }
    }
}