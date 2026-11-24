using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VoltCart.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddContactTopicAndOrderNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OrderNumber",
                table: "ContactMessages",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Topic",
                table: "ContactMessages",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OrderNumber",
                table: "ContactMessages");

            migrationBuilder.DropColumn(
                name: "Topic",
                table: "ContactMessages");
        }
    }
}
