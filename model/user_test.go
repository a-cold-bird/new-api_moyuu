package model

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestUserInsertWithTxPreservesInviterId(t *testing.T) {
	truncateTables(t)

	const inviterId = 123
	user := &User{
		Username:    "oauth_invitee",
		DisplayName: "OAuth Invitee",
	}

	err := DB.Transaction(func(tx *gorm.DB) error {
		return user.InsertWithTx(tx, inviterId)
	})
	require.NoError(t, err)

	var reloaded User
	require.NoError(t, DB.First(&reloaded, user.Id).Error)
	assert.Equal(t, inviterId, reloaded.InviterId)
}
