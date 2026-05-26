using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class MemberRole
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int Id { get; set; }

        [Required]
        [MaxLength(32)]
        public required string Name { get; set; }

        public ICollection<Member> Members { get; set; } = new List<Member>();
    }
}
