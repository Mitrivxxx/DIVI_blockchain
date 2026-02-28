using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using backend.Data;
using backend.Services.Auth;

namespace backend.Services.BackgroundJobs
{
	public class NonceCleanupService : BackgroundService
	{
		private readonly IServiceProvider _serviceProvider;
		private readonly TimeSpan _interval = TimeSpan.FromMinutes(1);
		private readonly TimeSpan _deleteInterval = TimeSpan.FromHours(24);
		private DateTime _lastDeleteTime = DateTime.MinValue;

		public NonceCleanupService(IServiceProvider serviceProvider)
		{
			_serviceProvider = serviceProvider;
		}

		protected override async Task ExecuteAsync(CancellationToken stoppingToken)
		{
			while (!stoppingToken.IsCancellationRequested)
			{
				using (var scope = _serviceProvider.CreateScope())
				{
					var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
					var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
					await authService.DeactivateExpiredNonces(dbContext);

					if ((DateTime.UtcNow - _lastDeleteTime) > _deleteInterval)
					{
						var threshold = DateTime.UtcNow.AddHours(-24);
						var unusedNonces = dbContext.Nonces.Where(n => !n.IsUsed && n.ExpiresAt < threshold).ToList();
						if (unusedNonces.Count > 0)
						{
							dbContext.Nonces.RemoveRange(unusedNonces);
							await dbContext.SaveChangesAsync();
						}
						_lastDeleteTime = DateTime.UtcNow;
					}
				}
				await Task.Delay(_interval, stoppingToken);
			}
		}
	}
}
